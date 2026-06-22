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
