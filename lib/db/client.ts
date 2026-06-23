import { Pool as NeonPool } from "@neondatabase/serverless";
import { drizzle as neonDrizzle } from "drizzle-orm/neon-serverless";
import { Pool as PgPool } from "pg";
import { drizzle as pgDrizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import type { Database } from "./types";
import { requireEnv } from "@/lib/env";

/**
 * Lazily-initialised database client.
 *
 * Driver selection:
 *  - **neon-serverless** (WebSocket pool) for Neon URLs — best for Vercel's
 *    serverless runtime and required for interactive transactions at scale.
 *  - **node-postgres** for everything else (local Postgres, CI service
 *    container) so DB-backed E2E can run without Neon credentials.
 *
 * Override with `DB_DRIVER=neon|pg`. Initialisation is deferred so `next build`
 * and non-DB code paths don't require `DATABASE_URL`.
 */
let _db: Database | null = null;

function chooseDriver(url: string): "neon" | "pg" {
  const override = process.env.DB_DRIVER;
  if (override === "neon" || override === "pg") return override;
  return /\.neon\.tech/.test(url) ? "neon" : "pg";
}

export function getDb(): Database {
  if (_db) return _db;
  const url = requireEnv("DATABASE_URL");

  if (chooseDriver(url) === "neon") {
    _db = neonDrizzle(new NeonPool({ connectionString: url }), { schema });
  } else {
    _db = pgDrizzle(new PgPool({ connectionString: url }), { schema });
  }
  return _db;
}
