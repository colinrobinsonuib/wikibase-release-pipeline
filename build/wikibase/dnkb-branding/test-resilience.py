"""Run against an isolated image: python test-resilience.py IMAGE.

No database, Kubernetes access, or outgoing notifications.
"""
from pathlib import Path
from contextlib import contextmanager
import subprocess
import sys
import tempfile
import time
import unittest
from urllib.error import HTTPError, URLError
from urllib.request import urlopen

IMAGE = sys.argv.pop(1)
HERE = Path(__file__).resolve().parent


def run_php(script, settings=None):
    with tempfile.TemporaryDirectory() as directory:
        path = Path(directory)
        (path / 'test.php').write_text(script)
        (path / 'settings').mkdir()
        if settings is not None:
            (path / 'settings' / '21-wbs-blue.php').write_text(settings)
        return subprocess.run([
            'docker', 'run', '--rm', '--entrypoint', 'php',
            '-v', f'{path / "test.php"}:/tmp/test.php:ro',
            '-v', f'{path / "settings"}:/run/dnkb-settings:ro',
            IMAGE, '/tmp/test.php',
        ], capture_output=True, text=True)


@contextmanager
def http_fixture(script):
    with tempfile.TemporaryDirectory() as directory:
        path = Path(directory)
        (path / 'test.php').write_text(script)
        (path / 'settings').mkdir()
        container = subprocess.check_output([
            'docker', 'run', '-d', '--rm', '--entrypoint', 'php',
            '-p', '127.0.0.1::80',
            '-v', f'{path / "test.php"}:/tmp/test.php:ro',
            '-v', f'{path / "settings"}:/run/dnkb-settings:ro',
            IMAGE, '-S', '0.0.0.0:80', '/tmp/test.php',
        ], text=True).strip()
        try:
            port = subprocess.check_output(['docker', 'port', container, '80/tcp'], text=True).strip().rsplit(':', 1)[1]
            url = f'http://127.0.0.1:{port}/w/api.php'
            for attempt in range(30):
                try:
                    with urlopen(url, timeout=1):
                        break
                except HTTPError as response:
                    response.close()
                    break
                except URLError:
                    if attempt == 29:
                        raise
                    time.sleep(0.1)
            yield container, url
        finally:
            subprocess.run(['docker', 'stop', container], capture_output=True, check=True)


class ResilienceTests(unittest.TestCase):
    def test_api_validator_and_production_ini(self):
        result = run_php((HERE / 'test-resilience.php').read_text())
        self.assertEqual(result.returncode, 0, result.stderr + result.stdout)

    def test_required_settings_load_and_preserve_scope(self):
        result = run_php('''<?php
require '/var/www/html/LocalSettings.d/21-wbs-blue.php';
if ($sentinel !== 'loaded' || $wgShowExceptionDetails || $wgShowDBErrorBacktrace) { exit(2); }
echo 'loaded';
''', "<?php $sentinel = 'loaded'; $wgShowExceptionDetails = true;")
        self.assertEqual(result.returncode, 0, result.stderr + result.stdout)
        self.assertEqual(result.stdout, 'loaded')

    def test_missing_settings_fail_closed_without_details(self):
        result = run_php('''<?php
register_shutdown_function(function () { fwrite(STDERR, 'status=' . http_response_code()); });
require '/var/www/html/LocalSettings.d/21-wbs-blue.php';
echo 'unsafe continuation';
''')
        self.assertEqual(result.returncode, 1, result.stderr)
        self.assertEqual(result.stdout, 'Service temporarily unavailable.\n')
        self.assertIn('status=503', result.stderr)
        self.assertIn('DNKB required settings failed', result.stderr)

    def test_invalid_settings_fail_closed_without_details(self):
        result = run_php("<?php require '/var/www/html/LocalSettings.d/21-wbs-blue.php';",
                         '<?php this is invalid syntax;')
        self.assertEqual(result.returncode, 1, result.stderr)
        self.assertEqual(result.stdout, 'Service temporarily unavailable.\n')
        self.assertIn('DNKB required settings failed', result.stderr)

    def test_other_php_warnings_are_logged_only(self):
        result = run_php("<?php trigger_error('private diagnostic sentinel', E_USER_WARNING); echo '{}';")
        self.assertEqual(result.stdout, '{}')
        self.assertIn('private diagnostic sentinel', result.stderr)

    def test_missing_settings_http_response_is_generic_503(self):
        with http_fixture("<?php require '/var/www/html/LocalSettings.d/21-wbs-blue.php';") as (_, url):
            with self.assertRaises(HTTPError) as raised:
                urlopen(url, timeout=2)
            response = raised.exception
            self.assertEqual(response.code, 503)
            self.assertEqual(response.headers['Content-Type'], 'text/plain; charset=utf-8')
            self.assertEqual(response.headers['Cache-Control'], 'no-store')
            self.assertEqual(response.read().decode(), 'Service temporarily unavailable.\n')
            response.close()

    def test_healthcheck_exercises_http_and_rejects_false_success(self):
        cases = [
            ('<?php header("Content-Type: application/json"); echo \'{"query":{"general":{"generator":"MediaWiki 1.43.6"}}}\';', 0),
            ('<?php header("Content-Type: application/json"); echo \'<br />Warning: private detail{"query":{}}\';', 1),
        ]
        for script, expected in cases:
            with self.subTest(expected=expected), http_fixture(script) as (container, _):
                result = subprocess.run(['docker', 'exec', container, 'php', '/usr/local/lib/dnkb/healthcheck.php'],
                                        capture_output=True, text=True)
                self.assertEqual(result.returncode, expected, result.stderr)
                self.assertNotIn('private detail', result.stderr + result.stdout)


if __name__ == '__main__':
    unittest.main()
