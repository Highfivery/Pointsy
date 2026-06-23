"use server";

import { redirect } from "next/navigation";
import { getDb } from "@/lib/db/client";
import { createSession } from "@/lib/auth/session";
import { rememberFamily, forgetFamily } from "@/lib/auth/device";
import {
  verifyPin,
  lookupFamilyByCode,
  type FamilyLookup,
} from "@/lib/people/service";
import { familyCodeSchema, kidSignInSchema } from "@/lib/validation/schemas";

/** Resolve a family code to its PIN-capable members for the profile picker. */
export async function lookupFamilyAction(
  code: string,
): Promise<FamilyLookup | null> {
  const parsed = familyCodeSchema.safeParse(code);
  if (!parsed.success) return null;
  const family = await lookupFamilyByCode(getDb(), parsed.data);
  // Remember the family on this device so the picker shows without re-typing
  // the code next time (including after sign-out).
  if (family) await rememberFamily(family.familyId);
  return family;
}

/** Drop this device's family association ("Use a different family"). */
export async function forgetFamilyAction(): Promise<void> {
  await forgetFamily();
}

export interface KidSignInState {
  error?: string;
}

export async function kidSignInAction(
  _prev: KidSignInState,
  formData: FormData,
): Promise<KidSignInState> {
  const parsed = kidSignInSchema.safeParse({
    familyId: formData.get("familyId"),
    personId: formData.get("personId"),
    pin: formData.get("pin"),
  });
  if (!parsed.success) return { error: "Enter your 4-digit PIN." };

  const result = await verifyPin(
    getDb(),
    parsed.data.familyId,
    parsed.data.personId,
    parsed.data.pin,
  );

  if (result.status === "locked") {
    return { error: "Too many wrong tries — try again in a minute." };
  }
  if (result.status === "invalid") {
    const tries = result.remaining;
    return {
      error:
        tries > 0
          ? `That PIN isn't right. ${tries} ${tries === 1 ? "try" : "tries"} left.`
          : "That PIN isn't right.",
    };
  }

  await createSession({
    familyId: result.person.familyId,
    personId: result.person.id,
    role: result.person.role,
  });
  redirect(result.person.role === "kid" ? "/me" : "/dashboard");
}
