import { PGlite } from "@electric-sql/pglite";
import { drizzle, type PgliteDatabase } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "@/lib/db/schema";

/**
 * In-memory Postgres (PGlite) wired to the real Drizzle schema and migrations.
 * Lets integration tests exercise actual SQL — transactions, constraints,
 * tenant isolation — with no Docker and no external DB. See SPEC §9.1–9.2.
 */
export interface TestDb {
  db: PgliteDatabase<typeof schema>;
  close: () => Promise<void>;
}

export async function createTestDb(): Promise<TestDb> {
  const client = new PGlite();
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: "./drizzle" });
  return { db, close: () => client.close() };
}
