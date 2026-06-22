---
description: Spec then implement a Pointsy feature end-to-end (branch, code, tests, changeset).
argument-hint: <short description of the feature>
---

Build this feature for Pointsy: **$ARGUMENTS**

1. Use the `spec-feature` skill to produce a mini-spec and surface any questions.
2. Once the approach is clear, use `implement-feature` to build it (branch off
   `main`, validation → action → UI → tests, changeset).
3. Finish with the `review-pr` and `a11y-audit` skills, then ensure
   `npm run typecheck`, `npm run lint`, `npm test` are green.

Follow all invariants in `AGENTS.md`. Do not commit to `main` directly.
