import { Pool } from "@neondatabase/serverless";
import { drizzle, type NeonDatabase } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";
import { requireEnv } from "@/lib/env";

/**
 * Lazily-initialised production database client (Neon serverless, pooled).
 *
 * The WebSocket pool driver is used (rather than neon-http) because Pointsy
 * relies on interactive transactions — e.g. approving a redemption writes a
 * ledger row and updates the redemption status atomically.
 *
 * Initialisation is deferred so that `next build` and non-DB code paths don't
 * require `DATABASE_URL` to be present.
 */
export type Db = NeonDatabase<typeof schema>;

let _db: Db | null = null;

export function getDb(): Db {
  if (!_db) {
    const pool = new Pool({ connectionString: requireEnv("DATABASE_URL") });
    _db = drizzle(pool, { schema });
  }
  return _db;
}
