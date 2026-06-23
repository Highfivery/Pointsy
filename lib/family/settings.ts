import { eq } from "drizzle-orm";
import type { Database } from "@/lib/db/types";
import { families } from "@/lib/db/schema";
import { normalizeTimezone } from "@/lib/timezone";

/** A family's timezone (defaults to UTC if unset). */
export async function getFamilyTimezone(
  db: Database,
  familyId: string,
): Promise<string> {
  const [f] = await db
    .select({ tz: families.timezone })
    .from(families)
    .where(eq(families.id, familyId))
    .limit(1);
  return f?.tz ?? "UTC";
}

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
