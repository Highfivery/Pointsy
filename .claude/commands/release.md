---
description: Prepare and cut a Pointsy release locally with Changesets.
---

Cut a release for Pointsy. There is no GitHub Actions release job; this runs
locally.

1. Check for pending changesets in `.changeset/`. If user-facing changes since the
   last release have no changeset, create them with `npm run changeset`.
2. Summarize the next version bump (patch/minor/major) and the changelog entries.
3. On an up-to-date, clean `main`, run `npm run release`. It runs
   `changeset version`, commits on `release/vX.Y.Z`, pushes, and opens a PR.
4. Check the PR diff is only `package.json`, `CHANGELOG.md`, and consumed
   changesets, then merge it: `gh pr merge <n> --squash --delete-branch`.
   Vercel deploys `main` to production and applies migrations.

Do not publish to npm — Pointsy is a deployed app, not a package.
