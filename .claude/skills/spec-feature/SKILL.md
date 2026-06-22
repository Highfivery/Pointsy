---
name: spec-feature
description: Turn a feature request into a concrete mini-spec for Pointsy before any code is written. Use when starting any non-trivial feature, when requirements are fuzzy, or when the user asks to "spec" or "plan" something.
---

# Spec a feature

Produce a short, concrete spec **before** writing code. Do not implement yet.

## Steps

1. **Read context:** `SPEC.md` (esp. the relevant section), the data model in
   `lib/db/schema.ts`, and any touched screens/actions.
2. **Clarify:** ask the user 2–4 sharp questions only where the request is
   genuinely ambiguous and the answer changes the design. Recommend a default.
3. **Write the mini-spec** with these headings:
   - **Goal** — one sentence.
   - **Users & permissions** — parent vs kid; what each can do.
   - **Data changes** — new/changed tables, columns, enums (note migration need).
   - **Server actions** — signatures + the Zod schema each validates.
   - **UI** — screens/components, states (loading/empty/error), mobile layout.
   - **Edge cases** — negatives, concurrency, tenant isolation, reserved points.
   - **Test plan** — unit (domain), integration (SQL/isolation), e2e + axe.
   - **Accessibility** — anything AAA-relevant for these screens.
   - **Out of scope** — what this explicitly does not do.

## Rules

- Honour the invariants in `AGENTS.md` (server-only DB, ledger append-only,
  scope by `familyId`, validate boundaries).
- Flag if a DB migration is required (then the `db-migration` skill comes next).
- Keep it tight — a spec someone can implement from, not an essay.
