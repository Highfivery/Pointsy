## What & why

<!-- A short description of the change and the motivation. Link any issue. -->

## How to test

<!-- Steps for a reviewer to verify the behaviour. -->

## Checklist

- [ ] `npm run typecheck`, `npm run lint`, `npm test` pass locally
- [ ] Added/updated unit or integration tests for the change
- [ ] Tenant isolation preserved (all queries scoped by `familyId` from session)
- [ ] Accessibility: keyboard + screen-reader checked; AAA contrast held (see `docs/accessibility.md`)
- [ ] Added a changeset (`npm run changeset`) if this is a user-facing change
- [ ] No secrets, PINs, or `DATABASE_URL`/`AUTH_SECRET` logged or sent client-side
