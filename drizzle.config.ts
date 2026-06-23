import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// drizzle-kit doesn't auto-load env files; load .env.local for CLI commands.
config({ path: ".env.local" });

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  // Prefer the direct (unpooled) URL for migrations to avoid PgBouncer issues;
  // fall back to DATABASE_URL (e.g. the Postgres service in CI).
  dbCredentials: {
    url: process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
});
