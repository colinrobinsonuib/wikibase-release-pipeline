<?php
// This loader belongs to the image, so a failed ConfigMap mount cannot remove it
// from LocalSettings.d's glob and silently omit the site's required settings.
try {
    require '/run/dnkb-settings/21-wbs-blue.php';
} catch ( Throwable $error ) {
    error_log( 'DNKB required settings failed: ' . $error->getMessage() );
    http_response_code( 503 );
    if ( PHP_SAPI !== 'cli' && !headers_sent() ) {
        header( 'Content-Type: text/plain; charset=utf-8' );
        header( 'Cache-Control: no-store' );
        header( 'Retry-After: 60' );
    }
    echo "Service temporarily unavailable.\n";
    exit( 1 );
}

// Detailed diagnostics belong in container logs, including MediaWiki exceptions.
$wgShowExceptionDetails = false;
$wgShowDBErrorBacktrace = false;
$wgShowSQLErrors = false;
