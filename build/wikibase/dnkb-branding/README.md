# DNKB Wikibase login branding

This directory is the maintained image source for the DNKB login branding originally deployed from dnkb commit 1ae097f. It keeps the patched PHP/faceted-search production base pinned by digest and adds only a bundled ResourceLoader extension and logo/favicon settings.

The main Wikibase Dockerfile also includes these files for future full source builds. The PHP-only security target deliberately retains the application tree of its baseline image; use an updated APPLICATION_IMAGE_URL if branding must be retained through a future PHP-only rebuild.

The login hook adds styles and an invitation/request-access note only on Special:UserLogin. It preserves MediaWiki messages, password reset, and OAuth controls. No database or on-wiki CSS edits are needed.

From this directory, build the production overlay:

```sh
docker build --platform linux/amd64 -t colinuib/wikibase:5.0.1-dnkb-login-r2 .
docker run --rm --entrypoint php -v "$PWD/test-hooks.php:/tmp/test-hooks.php:ro" colinuib/wikibase:5.0.1-dnkb-login-r2 /tmp/test-hooks.php
docker push colinuib/wikibase:5.0.1-dnkb-login-r2
```

The checked-in CSS is generated using the DNKB application's Tailwind dependencies and palette. To regenerate, install the DNKB app dependencies, then:

```sh
node build-css.mjs /path/to/dnkb/app
```

Deploy web and jobrunner together using the resulting immutable digest in the sigma2 repository's cell/wikibase/dnkb-blue deployment manifests. Check both rollouts, the public login page in desktop/mobile/dark modes, the request-access link, and a normal item page. Roll back both deployments to the preceding immutable image if needed.