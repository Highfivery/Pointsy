---
name: implement-feature
description: Implement a Pointsy feature end-to-end against an agreed spec, following the house rules. Use after spec-feature, or when the user asks to build/implement a feature.
---

# Implement a feature

Build the feature wired together: validation → action → UI → tests.

## Order of work

1. **Branch:** create a feature branch off `main` (`feat/<slug>`).
2. **Data (if needed):** update `lib/db/schema.ts`, then use the `db-migration`
   skill to generate the migration. Keep changes additive where possible.
3. **Validation:** add/extend Zod schemas in `lib/validation`.
4. **Domain logic:** put pure rules in `lib/domain` (unit-testable, no I/O).
5. **Server action / route handler:**
   - `getSession()` / `requireParent()` for authz; scope every query by the
     session's `familyId`.
   - Validate input with the Zod schema; do points mutations in a transaction.
   - Never leak secrets; return only what the client needs.
6. **UI:** Server Components by default; CSS Modules + design tokens; lucide
   icons; optimistic updates for awards/redemptions; loading/empty/error states;
   ≥44px targets; labelled controls.
7. **Tests:** unit (domain), integration (PGlite incl. tenant isolation),
   e2e + axe for the new screen.
8. **Changeset:** `npm run changeset` for user-facing changes.

## Before declaring done

Run and fix until green: `npm run typecheck`, `npm run lint`,
`npm run format`, `npm test`. Then run the `review-pr` and `a11y-audit` skills.

**Then look at it.** For any UI change, render the screen and capture a
screenshot — run `npm run dev`, or Playwright against a throwaway Postgres:
`docker run --rm -d -p 5432:5432 -e POSTGRES_USER=pointsy -e POSTGRES_PASSWORD=pointsy -e POSTGRES_DB=pointsy postgres:16`,
then `DATABASE_URL=postgres://pointsy:pointsy@localhost:5432/pointsy npm run db:migrate`.
Screenshot **every affected screen in each state it can have** (signed-out vs
known-device, empty vs populated, light/dark), confirm it matches intent, and
attach the screenshots to the PR. Typecheck/lint passing is NOT UI verification.

**Auth/entry rule:** a signed-in user, or a device that already knows a family,
must never land on marketing or a sign-in form — `/` is the PIN-gated profile
picker for them (resolved from session first, cookie second). If you touch
routing/entry/auth, test the home in **all** of: new device, signed-out known
device, **logged-in** (active session), and active session with the family
cookie cleared. Also test **role isolation** — open a parent URL with a kid
session (and vice-versa) and assert the redirect. A session cookie is not
authorisation. (AGENTS.md invariants 8 & 9.)
