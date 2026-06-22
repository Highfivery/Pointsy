---
description: Prepare a Pointsy release — ensure changesets exist and explain the version/deploy flow.
---

Prepare a release for Pointsy.

1. Check for pending changesets in `.changeset/`. If user-facing changes since the
   last release have no changeset, create them with `npm run changeset`.
2. Summarize what the next version bump will be (patch/minor/major) and the
   changelog entries it will produce.
3. Remind: merging to `main` triggers the **Release** workflow, which opens/updates
   a "Version Packages" PR (Changesets). Merging that PR cuts the release and tags
   it; Vercel deploys `main` to production automatically.

Do not publish to npm — Pointsy is a deployed app, not a package.
