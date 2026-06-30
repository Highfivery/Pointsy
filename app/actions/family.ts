"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { requireParent, destroySession } from "@/lib/auth/session";
import { forgetFamily } from "@/lib/auth/device";
import { setFamilyTimezone } from "@/lib/family/settings";
import { deleteFamily } from "@/lib/family/account";
import { families } from "@/lib/db/schema";
import { isValidTimezone } from "@/lib/timezone";
import { type FormState } from "@/lib/validation/form";

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

/**
 * Permanently delete the whole family and all its data. Owner-only, and guarded
 * by typing the family name. Clears the session + device memory and returns the
 * device to the marketing/home screen.
 */
export async function deleteFamilyAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireParent();
  const db = getDb();
  const [family] = await db
    .select({ name: families.name, ownerId: families.ownerId })
    .from(families)
    .where(eq(families.id, session.familyId))
    .limit(1);
  if (!family) return { error: "Could not find your family." };
  if (family.ownerId !== session.personId) {
    return { error: "Only the family owner can delete the family." };
  }
  const confirm = (formData.get("confirm") ?? "").toString().trim();
  if (confirm !== family.name) {
    return { fieldErrors: { confirm: `Type "${family.name}" to confirm.` } };
  }

  await deleteFamily(db, session.familyId);
  await destroySession();
  await forgetFamily();
  redirect("/");
}
