import "server-only";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db/client";
import { lookupFamilyById, type FamilyLookup } from "@/lib/people/service";

/**
 * "This device belongs to family X" memory. Separate from the session: it
 * persists across sign-out so a shared family device keeps showing its profile
 * picker (no re-typing the family code). Holds the familyId only — never any
 * secret — so it's safe as a long-lived cookie.
 */
const FAMILY_COOKIE = "pointsy_family";
const ONE_YEAR_SEC = 60 * 60 * 24 * 365;

export async function rememberFamily(familyId: string): Promise<void> {
  const store = await cookies();
  store.set(FAMILY_COOKIE, familyId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR_SEC,
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

/** The family this device is associated with (for the profile picker), or null. */
export async function getKnownFamily(): Promise<FamilyLookup | null> {
  const familyId = await getRememberedFamilyId();
  if (!familyId) return null;
  return lookupFamilyById(getDb(), familyId);
}
