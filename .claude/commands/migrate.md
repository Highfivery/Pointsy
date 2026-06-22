---
description: Make a safe Drizzle schema change and generate the migration.
argument-hint: <what the schema change should accomplish>
---

Make this schema change for Pointsy: **$ARGUMENTS**

Use the `db-migration` skill. Edit `lib/db/schema.ts`, prefer additive changes,
run `npm run db:generate -- --name <snake_case>`, review the generated SQL, then
confirm `npm test` passes (PGlite runs the migrations). Add a tenant-isolation
test for any new table.
