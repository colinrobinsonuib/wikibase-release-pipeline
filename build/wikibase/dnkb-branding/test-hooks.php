<?php
// Run with PHP from the built image; no database or MediaWiki bootstrap needed.
class TestTitle {
    public function __construct( private bool $login ) {}
    public function isSpecial( string $name ): bool { return $this->login && $name === 'Userlogin'; }
}
class OutputPage {
    public array $modules = [];
    public string $html = '';
    public function __construct( private bool $login ) {}
    public function getTitle(): TestTitle { return new TestTitle( $this->login ); }
    public function addModuleStyles( string $module ): void { $this->modules[] = $module; }
    public function addHTML( string $html ): void { $this->html .= $html; }
}
class Skin {}
require '/var/www/html/extensions/DNKBBranding/Hooks.php';
foreach ( [ false, true ] as $login ) {
    $out = new OutputPage( $login );
    DNKBBrandingHooks::onBeforePageDisplay( $out, new Skin() );
    if ( $login ) {
        if ( $out->modules !== [ 'ext.dnkb.login' ] || !str_contains( $out->html, 'https://dnkb.cdn.uib.no/login?stay=1' ) ) {
            throw new RuntimeException( 'Login must load styling and the request-access destination' );
        }
    } elseif ( $out->modules !== [] || $out->html !== '' ) {
        throw new RuntimeException( 'Other pages must be unaffected' );
    }
}
echo "Login hook checks passed\n";
