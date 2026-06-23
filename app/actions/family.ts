"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db/client";
import { requireParent } from "@/lib/auth/session";
import { setFamilyTimezone } from "@/lib/family/settings";
import { isValidTimezone } from "@/lib/timezone";

/** Parent sets the family timezone (used by daily/weekly chore limits). */
export async function setFamilyTimezoneAction(
  tz: unknown,
): Promise<{ ok: boolean }> {
  const session = await requireParent();
  if (!isValidTimezone(tz)) return { ok: false };
  await setFamilyTimezone(getDb(), session.familyId, tz);
  revalidatePath("/dashboard");
  return { ok: true };
}
