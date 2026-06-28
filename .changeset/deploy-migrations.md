---
"pointsy": patch
---

Apply database migrations automatically on production deploys
(`scripts/vercel-migrate.mjs` runs before the build when `VERCEL_ENV=production`).
This closes the gap that let a schema-dependent query ship ahead of its migration
and break kid login — the deploy now never serves code against an un-migrated
database.
