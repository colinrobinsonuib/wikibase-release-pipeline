FROM colinuib/wikibase:5.0.1-facet-982e51f-php8.3.36-r3@sha256:b2475a9ede997870e916543f7d3e2939cc48620a1e00b0603e8708a574af4b0a
ARG VCS_REF
LABEL org.opencontainers.image.source="https://github.com/colinrobinsonuib/wikibase-release-pipeline" \
      org.opencontainers.image.revision="${VCS_REF}"
COPY DNKBBranding /var/www/html/extensions/DNKBBranding
COPY 99-DNKBBranding.php /var/www/html/LocalSettings.d/99-DNKBBranding.php
COPY 21-wbs-blue.php /var/www/html/LocalSettings.d/21-wbs-blue.php
COPY zzz-dnkb-production.ini /usr/local/etc/php/conf.d/zzz-dnkb-production.ini
COPY healthcheck.php /usr/local/lib/dnkb/healthcheck.php
