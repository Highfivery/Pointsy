import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type * as schema from "./schema";

/**
 * Driver-agnostic Drizzle database type. The concrete clients
 * (neon-serverless in production, node-postgres in CI, PGlite in tests) all
 * extend `PgDatabase`, so query/service functions accept any of them — which is
 * what makes the service layer testable against PGlite.
 */
export type Database = PgDatabase<
  PgQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;
