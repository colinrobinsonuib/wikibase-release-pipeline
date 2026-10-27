# DNKB query frontend

A small overlay on the digest-pinned production frontend, retaining the upstream editor and query engine. It sets DNKB branding, canonical public URLs, local prefixes, an agent-discovery file and a help banner. A companion script corrects the upstream hard-coded Wikidata prefix controls and supplies the shared examples to the native Examples dialog. It runs after the upstream bundle and before DOM ready initializes the App. No wiki edits are required.

The definitions and TypeScript integration source live in https://github.com/colinrobinsonuib/dnkb under app/src/lib/queryGuide.ts and app/scripts/query-frontend.ts. Generated dnkb-query.js, llms.txt and wdqs-frontend-config.json are committed here so this image builds without a second checkout or a Node build toolchain.

To update, from the DNKB app checkout:

```sh
npm run queries:verify -- ../deployment/query-guide-verification.json
npm run queries:export -- /path/to/wikibase-release-pipeline/build/wdqs-frontend/dnkb
npm run test:unit
```

Build from this directory, label it with the source revision, and push a new immutable tag:

```sh
docker build --platform linux/amd64 \
  --label org.opencontainers.image.source=https://github.com/colinrobinsonuib/wikibase-release-pipeline \
  --label org.opencontainers.image.revision="$(git rev-parse HEAD)" \
  -t colinuib/wdqs-frontend:2-dnkb-guide-r1 .
docker push colinuib/wdqs-frontend:2-dnkb-guide-r1
```

Before changing the base image, verify the native Examples dialog, opening/running all examples, Add prefixes and namespace shortcuts against the actual bundle. This integration depends on the pinned frontend's RdfNamespaces and QuerySamples interfaces. Check help links and /llms.txt too.

Deployment source: sigma2/cell/wikibase/dnkb-blue/07-wbs-blue-wdqs-frontend-deployment.yaml. Commit its new image digest before applying the YAML. Rollback is a committed manifest revert to the preceding image; no live patches.