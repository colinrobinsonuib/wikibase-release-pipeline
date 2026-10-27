<?php
class DNKBBrandingHooks {
    public static function onBeforePageDisplay( OutputPage $out, Skin $skin ): void {
        if ( !$out->getTitle()->isSpecial( 'Userlogin' ) ) {
            return;
        }
        $out->addModuleStyles( 'ext.dnkb.login' );
        // Add a note without replacing localized login messages or authentication controls.
        $out->addHTML(
            '<div class="dnkb-login-note">'
            . '<p>Use your DNKB / Wikibase account. When signing in from DNKB, you will return there after signing in.</p>'
            . '<p><strong>No account yet?</strong> Accounts are by invitation. '
            . '<a href="https://dnkb.cdn.uib.no/login?stay=1">Request access</a></p></div>'
        );
    }
}
