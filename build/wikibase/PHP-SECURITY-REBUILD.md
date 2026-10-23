# PHP-only security rebuild

The normal build now pins PHP 8.3.36 Apache on Debian Bookworm by digest.
MediaWiki and all extension revision pins remain unchanged.

For the October 2026 PHP2Shell fix, use the `php-security` target. It rebuilds
the PHP runtime/extensions on the patched official PHP base and copies the
application tree, Composer dependencies, entrypoints and application settings
from the immutable image previously deployed to DNKB. It does not run Composer
or MediaWiki database migrations during the image build.

From `build/wikibase`, build for the cluster's architecture:

```sh
docker buildx build --platform linux/amd64 --target php-security --load \
  --build-arg PHP_IMAGE_URL=php:8.3.36-apache-bookworm@sha256:cbd3b3d9011668443d54ab40ec31db56c73d91b4c8198935d639aa80d2d815c1 \
  --build-arg COMPOSER_IMAGE_URL=docker-registry.wikimedia.org/releng/composer-php82:0.1.1-s3 \
  --build-arg GIT_CURRENT_REVISION="$(git rev-parse HEAD)" \
  -t colinuib/wikibase:5.0.1-facet-982e51f-php8.3.36-r3 .
```

`APPLICATION_IMAGE_URL` defaults to the deployed image digest
`colinuib/wikibase@sha256:371896aa6079e9a6ff32495dbd01be68934975d954409a25e2423da0672fa0ca`.
An explicit override is required when using a different application baseline.
The standard default `wikibase` target continues to build from source.

Before publishing, verify PHP version/modules, Apache configuration, byte-for-byte
application file fingerprints, and application startup against a restored database
with copied uploads/configuration. Deploy web and jobrunner using the published
image digest and retain backups and the previous image digest for rollback.

The security target also disables session upload progress before PHP request
initialization, following PHP's 23 October 2026 informational advisory.
