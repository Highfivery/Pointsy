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
6. **Apply the migration to the DB the app actually uses** — `npm run db:migrate`
   (reads `.env.local` → the Neon DB). This is a **guarded production action**:
   show the exact command and get explicit authorization. The deploy also applies
   it automatically (`scripts/vercel-migrate.mjs` runs before build on production).
7. **Run the app against that migrated DB and exercise the changed read/write
   paths** (e.g. the kid `/me` screen for a chores change). Screenshots/dev runs
   against a throwaway Docker DB do **not** count — that DB isn't the one the user
   runs.

## Guardrails

- **Green tests do NOT mean the real DB is migrated.** Vitest/PGlite and Playwright
  each migrate a _throwaway_ DB, so a new column always exists in tests even when
  the real DB is behind. Never say "done" for a migration change until step 6 has
  run against the real DB and step 7 confirms the live app works. (Shipping a
  `category_id` query ahead of its migration broke kid login in 0.31.x.)
- Never edit an already-committed migration file — add a new one.
- Ledger stays append-only; don't add update/delete paths for it.
- Money/points columns are `integer` and may be negative.
