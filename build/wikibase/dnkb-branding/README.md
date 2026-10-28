# DNKB Wikibase login branding

This directory is the maintained image source for the DNKB login branding originally deployed from dnkb commit 1ae097f. It keeps the patched PHP/faceted-search production base pinned by digest and adds a bundled ResourceLoader extension, logo/favicon settings, and production failure handling.

The main Wikibase Dockerfile also includes the branding assets for future full source builds; the failure-handling additions here belong to this production overlay. The PHP-only security target deliberately retains the application tree of its baseline image; use an updated APPLICATION_IMAGE_URL if branding must be retained through a future PHP-only rebuild.

The login hook adds styles and an invitation/request-access note only on Special:UserLogin. It preserves MediaWiki messages, password reset, and OAuth controls. No database or on-wiki CSS edits are needed.

From this directory, build the production overlay:

```sh
docker build --platform linux/amd64 -t colinuib/wikibase:5.0.1-dnkb-resilience-r1 .
docker run --rm --entrypoint php -v "$PWD/test-hooks.php:/tmp/test-hooks.php:ro" colinuib/wikibase:5.0.1-dnkb-resilience-r1 /tmp/test-hooks.php
python test-resilience.py colinuib/wikibase:5.0.1-dnkb-resilience-r1
docker push colinuib/wikibase:5.0.1-dnkb-resilience-r1
```

The checked-in CSS is generated using the DNKB application's Tailwind dependencies and palette. To regenerate, install the DNKB app dependencies, then:

```sh
node build-css.mjs /path/to/dnkb/app
```

Deploy web and jobrunner together using the resulting immutable digest in the sigma2 repository's cell/wikibase/dnkb-blue deployment manifests. Check both rollouts, the public login page in desktop/mobile/dark modes, the request-access link, and a normal item page. Roll back both deployments to the preceding immutable image if needed.

## Repository ownership

This directory in colinrobinsonuib/wikibase-release-pipeline (release branch
`deploy-5.0.1`) owns the DNKB Wikibase image overlay: Dockerfile, PHP runtime
loaders, production ini, health checks, branding, and their isolated tests.
`21-wbs-blue.php` here is the image-owned required-settings loader; the actual
site settings are maintained as a ConfigMap in the sigma2 repository.
Do not copy these image sources into the DNKB application repository.

The sigma2 repository owns site ConfigMaps, Secrets, Kubernetes manifests,
namespace monitoring, and rollout/recovery records under `cell/wikibase/dnkb-blue`.
The DNKB repository owns the application and its Tailwind palette. Reference
those sources from this repo when regenerating CSS; do not duplicate the image
build context into DNKB. Historical image-only release patches are retired.

See [resilience.md](resilience.md) for required-settings loading, generic 503
responses, JSON-validating readiness, regression tests, and deployment limits.
The hardened image and the read-only `/run/dnkb-settings` mount must roll out and
roll back together through committed sigma2 manifests. Image source and tests
stay here; rollout notes stay with those deployment manifests.
