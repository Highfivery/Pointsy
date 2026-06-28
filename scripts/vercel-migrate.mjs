// Apply Drizzle migrations as part of the Vercel *production* build, so a schema
// change can never ship ahead of its migration again (the bug that broke kid
// login in 0.31.x: `chores.category` → `category_id` deployed without the table
// actually being migrated).
//
// Guarded so it only ever runs for the production deploy:
//   - VERCEL_ENV === "production"  → run migrations
//   - preview / local / anything else → skip (never migrate the prod DB from a
//     throwaway preview build or a developer's local `npm run build`)
//
// Requires DIRECT_DATABASE_URL (unpooled) in the Vercel production environment —
// migrations run DDL and must not go through the PgBouncer pooler. drizzle.config
// falls back to DATABASE_URL if the direct URL is absent.
import { execSync } from "node:child_process";

const env = process.env.VERCEL_ENV ?? "local";

if (env !== "production") {
  console.log(`[migrate] Skipping migrations (VERCEL_ENV=${env}).`);
  process.exit(0);
}

if (!process.env.DIRECT_DATABASE_URL && !process.env.DATABASE_URL) {
  console.error(
    "[migrate] No DIRECT_DATABASE_URL/DATABASE_URL set on the production build — cannot migrate.",
  );
  process.exit(1);
}

console.log("[migrate] Production deploy — applying pending migrations…");
execSync("npm run db:migrate", { stdio: "inherit" });
console.log("[migrate] Migrations up to date.");
