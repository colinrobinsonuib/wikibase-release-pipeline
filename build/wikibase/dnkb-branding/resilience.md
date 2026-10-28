# Wikibase failure handling

Maintained image source: `colinrobinsonuib/wikibase-release-pipeline`,
`deploy-5.0.1`, `build/wikibase/dnkb-branding`. Keep runtime PHP, ini, health
checks, Dockerfiles, and their tests here; actual site configuration, Kubernetes
manifests, and monitoring belong in sigma2. DNKB owns the application only.

On 28 October 2026 the recent-changes API returned HTTP 200 with PHP warnings
before and after the JSON. Reading the mounted `21-wbs-blue.php` failed with
`Input/output error`. Other mounts, container logs, and the Docker socket on
`lmd-spw01` also failed. The updater rejected the corrupted JSON and restarted;
the wiki's HTTP-status-only probes continued reporting it ready.

The [Sigma2 incident](https://opslog.sigma2.no/incidents/250282), opened on
1 October, reports NIRD SP filesystem trouble. It does not prove that this node
failure has existed continuously since then or give a recovery date.

## Settings ownership

The upstream image generates the base `LocalSettings.php` once, persists it on
the configuration PVC, and copies it into the web container at startup. Its
extension loader includes `LocalSettings.d/*.php`. The site-specific override
comes from the `wbs-blue-configmap-wikibase-settings` ConfigMap, not that PVC.
It includes database, URL, extension, and permission settings and is required.
Making it optional would allow the wiki to run with incomplete configuration.

The hardened image owns `LocalSettings.d/21-wbs-blue.php`. The ConfigMap is
mounted read-only as a directory at `/run/dnkb-settings`; the image loader
requires its `21-wbs-blue.php` from there. A missing or invalid override fails
with HTTP 503 and a generic, non-cacheable response, and exits nonzero for CLI
jobs. The diagnostic goes to stderr. Moving the mount prevents a missing
ConfigMap file from disappearing silently from the extension-loader glob.
Directory mounts also avoid subPath's lack of ConfigMap update propagation.
Settings changes still need validation and coordinated rollout for both workers
and web containers; this is not a configuration hot-reload mechanism.

PHP display_errors and display_startup_errors are disabled in a late-loading
image ini file, including during bootstrap. PHP errors go to container stderr.
MediaWiki exception details and database backtraces are disabled after loading
the required override. Hiding diagnostics alone would not fix an omitted setting;
the required loader supplies that separate protection.

## Health and monitoring

Web readiness calls the actual local `/w/api.php` endpoint with the canonical
Host and forwarded protocol. It requires HTTP 200, application/json, parseable
JSON, no API error, and MediaWiki siteinfo. Redirects, warning-corrupted bodies,
and connection failures fail readiness. After three failed checks the pod is
removed from service traffic and the existing namespace monitor detects it.
Liveness remains separate so a dependency outage need not repeatedly restart
Apache. Exec probe failures also prevent readiness when the runtime is broken.

The namespace monitor additionally recognizes Input/output error in logs and
alerts when logs of an established running container cannot be read. Such alerts
are deduplicated, retried after failed delivery, and re-armed after a successful
log read. This avoids interpreting unavailable evidence as healthy. Existing
five-minute polling and ten-minute log-scan startup grace still apply.

## Limits and rollout

These changes improve failure isolation, public responses, and detection. They
cannot repair a broken node or shared storage. Image files, mounted settings,
uploads, and configuration still ultimately depend on the platform. Adding web
replicas alone does not make shared storage or the database highly available.
No checkpoint should be advanced to bypass an updater failure.

Test the image with `python test-resilience.py IMAGE` and `test-hooks.php`. In
the sigma2 repository run `python3 -m unittest discover -s tests -v` (PyYAML is
required for manifest checks). Commit source and deployment changes, publish
the immutable image, inspect `kubectl diff`, then apply the maintained web and
jobrunner manifests together. Apply only the monitor ConfigMap and Deployment
from its committed multi-document manifest; leave its Secret unchanged.

Verify readiness, public API JSON and content type, absence of public PHP
diagnostics, jobrunner logs, updater successful polling/checkpoint, and the
monitor's script checksum. A wiki with no new edits may retain the same updater
checkpoint; successful recent-change polling must also be checked. Roll back
image and settings mount changes together by reverting the deployment commit
and reapplying those manifests.
