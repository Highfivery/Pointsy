import { eq } from "drizzle-orm";
import type { Database } from "@/lib/db/types";
import { families } from "@/lib/db/schema";
import { normalizeTimezone } from "@/lib/timezone";

/** Set a family's timezone (validated; falls back to UTC). */
export async function setFamilyTimezone(
  db: Database,
  familyId: string,
  tz: unknown,
): Promise<void> {
  await db
    .update(families)
    .set({ timezone: normalizeTimezone(tz) })
    .where(eq(families.id, familyId));
}
