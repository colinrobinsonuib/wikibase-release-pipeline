<?php
// Isolated checks: no MediaWiki bootstrap, database, cluster, or notifications.
require '/usr/local/lib/dnkb/healthcheck.php';

$valid = '{"batchcomplete":"","query":{"general":{"generator":"MediaWiki 1.43.6"}}}';
$cases = [
    [200, 'application/json; charset=utf-8', $valid, true],
    [200, 'text/html', $valid, false],
    [200, 'application/json', '<br />Warning: failed include' . $valid, false],
    [200, 'application/json', '{"error":{"code":"internal_api_error"}}', false],
    [200, 'application/json', '{}', false],
    [503, 'application/json', $valid, false],
    [302, 'application/json', $valid, false],
    [200, 'application/json', $valid . '<br />Warning: headers', false],
];
foreach ( $cases as [ $status, $type, $body, $expected ] ) {
    if ( dnkbHealthyApiResponse( $status, $type, $body ) !== $expected ) {
        throw new RuntimeException( "Unexpected health result for HTTP $status / $type / $body" );
    }
}
if ( ini_get( 'display_errors' ) || ini_get( 'display_startup_errors' ) || !ini_get( 'log_errors' ) ) {
    throw new RuntimeException( 'PHP must log diagnostics without displaying them' );
}
if ( ini_get( 'error_log' ) !== '/proc/self/fd/2' ) {
    throw new RuntimeException( 'PHP diagnostics must reach container stderr' );
}
echo "API health and PHP production settings checks passed\n";
