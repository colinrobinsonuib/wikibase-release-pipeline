<?php
// Validate the body as well as HTTP status. PHP warnings can accompany HTTP 200.
function dnkbHealthyApiResponse( int $status, string $contentType, string $body ): bool {
    if ( $status !== 200 || strtolower( trim( explode( ';', $contentType )[0] ) ) !== 'application/json' ) {
        return false;
    }
    try {
        $response = json_decode( $body, true, 512, JSON_THROW_ON_ERROR );
    } catch ( JsonException ) {
        return false;
    }
    return is_array( $response ) && !isset( $response['error'] ) &&
        is_string( $response['query']['general']['generator'] ?? null ) &&
        str_starts_with( $response['query']['general']['generator'], 'MediaWiki ' );
}

if ( realpath( $_SERVER['SCRIPT_FILENAME'] ?? '' ) !== __FILE__ ) {
    return;
}

$context = stream_context_create( [ 'http' => [
    'timeout' => 4,
    'ignore_errors' => true,
    'follow_location' => 0,
    'header' => "Host: wbs.cdn.uib.no\r\nX-Forwarded-Proto: https\r\nConnection: close\r\n",
] ] );
$body = @file_get_contents(
    'http://127.0.0.1/w/api.php?action=query&meta=siteinfo&siprop=general&format=json',
    false, $context, 0, 1048576
);
$status = 0;
$contentType = '';
foreach ( $http_response_header ?? [] as $header ) {
    if ( preg_match( '~^HTTP/\S+ (\d{3})~', $header, $matches ) ) {
        $status = (int)$matches[1];
    } elseif ( stripos( $header, 'Content-Type:' ) === 0 ) {
        $contentType = trim( substr( $header, strlen( 'Content-Type:' ) ) );
    }
}
if ( $body === false || !dnkbHealthyApiResponse( $status, $contentType, $body ) ) {
    // Never print the response body: it can contain sensitive diagnostics.
    fwrite( STDERR, "MediaWiki API health check failed (HTTP $status)\n" );
    exit( 1 );
}
