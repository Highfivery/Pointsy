---
name: db-migration
description: Safely change the Pointsy Drizzle schema and generate a migration. Use whenever a feature needs a new/changed table, column, enum, or index.
---

# Database migration

## Steps

1. **Edit `lib/db/schema.ts`.** Keep every domain table carrying `familyId` with
   `references(() => families.id, { onDelete: "cascade" })`. Add an index on
   `familyId` for new tables. Export `$inferSelect`/`$inferInsert` types.
2. **Prefer additive changes.** Add nullable columns or new tables rather than
   renaming/dropping. For a rename, do expand → backfill → contract across
   separate migrations.
3. **Generate:** `npm run db:generate -- --name <short_snake_case>`.
4. **Review the SQL** in `drizzle/` — confirm no unintended drops, FKs and
   `onDelete` are correct, and enums are altered (not recreated) where possible.
5. **Verify against real SQL:** the PGlite integration tests run all migrations;
   `npm test` must pass. Add a tenant-isolation test for any new table.
6. **Apply to a real DB** with `npm run db:migrate` (against a Neon branch for
   review; production migrates on deploy).

## Guardrails

- Never edit an already-committed migration file — add a new one.
- Ledger stays append-only; don't add update/delete paths for it.
- Money/points columns are `integer` and may be negative.
