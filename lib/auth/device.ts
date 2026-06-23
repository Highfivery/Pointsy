import "server-only";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db/client";
import { getSession } from "./session";
import { FAMILY_COOKIE, FAMILY_COOKIE_MAX_AGE } from "./token";
import { lookupFamilyById, type FamilyLookup } from "@/lib/people/service";

/**
 * "This device belongs to family X" memory. Separate from the session: it
 * persists across sign-out so a shared family device keeps showing its profile
 * picker (no re-typing the family code). Holds the familyId only — never any
 * secret — so it's safe as a long-lived cookie.
 */
export async function rememberFamily(familyId: string): Promise<void> {
  const store = await cookies();
  store.set(FAMILY_COOKIE, familyId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: FAMILY_COOKIE_MAX_AGE,
  });
}

export async function getRememberedFamilyId(): Promise<string | null> {
  const store = await cookies();
  return store.get(FAMILY_COOKIE)?.value ?? null;
}

export async function forgetFamily(): Promise<void> {
  const store = await cookies();
  store.delete(FAMILY_COOKIE);
}

/**
 * The family whose profile picker the home page should show, or null.
 * Resolved from the **session first** (a signed-in user is always recognized,
 * even on a device whose cookie predates this feature) and the device cookie
 * second (so a signed-out shared device still shows its picker).
 */
export async function getKnownFamily(): Promise<FamilyLookup | null> {
  const session = await getSession();
  const familyId = session?.familyId ?? (await getRememberedFamilyId());
  if (!familyId) return null;
  return lookupFamilyById(getDb(), familyId);
}
