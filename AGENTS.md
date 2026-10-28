# Repository ownership and publication

- DNKB Wikibase image source and isolated tests belong in build/wikibase/dnkb-branding on the deploy-5.0.1 release line. Site settings and Kubernetes manifests belong in the sigma2 repository; application code belongs in dnkb. Do not duplicate these sources across repositories.
- Push DNKB release changes to the colinrobinsonuib/wikibase-release-pipeline fork, not wmde upstream.
- Before publishing images or deploying to any server, commit and push all corresponding source/configuration to GitHub and verify the remote revision. Build images from that committed source. Commit and push exact image digests and deployment manifests before applying them. Never publish or deploy uncommitted or local-only changes.
