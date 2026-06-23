import { and, eq, isNotNull } from "drizzle-orm";
import type { Database } from "@/lib/db/types";
import { people, families, type Person } from "@/lib/db/schema";
import { hashSecret, verifySecret } from "@/lib/auth/password";
import {
  getFamilyByCode,
  getPersonById,
  listFamilyMembers,
} from "@/lib/db/queries";

/** Lockout policy for PIN sign-in. */
export const MAX_PIN_ATTEMPTS = 5;
export const PIN_LOCK_MS = 60_000;

export interface AddKidInput {
  name: string;
  avatar: string;
  color: string;
  pin: string;
}

/** Active kids in a family, in picker order. */
export async function listKids(
  db: Database,
  familyId: string,
): Promise<Person[]> {
  const members = await listFamilyMembers(db, familyId);
  return members.filter((m) => m.role === "kid");
}

export async function addKid(
  db: Database,
  familyId: string,
  input: AddKidInput,
): Promise<Person> {
  const pinHash = await hashSecret(input.pin);
  const siblings = await listKids(db, familyId);
  const [kid] = await db
    .insert(people)
    .values({
      familyId,
      role: "kid",
      name: input.name.trim(),
      avatar: input.avatar,
      color: input.color,
      pinHash,
      sortOrder: siblings.length,
    })
    .returning();
  return kid;
}

export async function updateKid(
  db: Database,
  familyId: string,
  id: string,
  fields: { name: string; avatar: string; color: string },
): Promise<void> {
  await db
    .update(people)
    .set({
      name: fields.name.trim(),
      avatar: fields.avatar,
      color: fields.color,
    })
    .where(
      and(
        eq(people.familyId, familyId),
        eq(people.id, id),
        eq(people.role, "kid"),
      ),
    );
}

/** Set/reset a person's PIN and clear any lockout. */
export async function setPin(
  db: Database,
  familyId: string,
  id: string,
  pin: string,
): Promise<void> {
  const pinHash = await hashSecret(pin);
  await db
    .update(people)
    .set({ pinHash, pinFailedAttempts: 0, pinLockedUntil: null })
    .where(and(eq(people.familyId, familyId), eq(people.id, id)));
}

export async function setKidActive(
  db: Database,
  familyId: string,
  id: string,
  isActive: boolean,
): Promise<void> {
  await db
    .update(people)
    .set({ isActive })
    .where(
      and(
        eq(people.familyId, familyId),
        eq(people.id, id),
        eq(people.role, "kid"),
      ),
    );
}

export interface PickerMember {
  id: string;
  name: string;
  avatar: string;
  color: string;
  role: "parent" | "kid";
}

export interface FamilyLookup {
  familyId: string;
  familyName: string;
  members: PickerMember[];
}

/**
 * Resolve a family by its code to the PIN-capable, active members shown in the
 * profile picker. Returns only non-sensitive fields (no email/hash). Null if the
 * code doesn't match a family.
 */
async function pickerMembers(
  db: Database,
  familyId: string,
): Promise<PickerMember[]> {
  return db
    .select({
      id: people.id,
      name: people.name,
      avatar: people.avatar,
      color: people.color,
      role: people.role,
    })
    .from(people)
    .where(
      and(
        eq(people.familyId, familyId),
        eq(people.isActive, true),
        isNotNull(people.pinHash),
      ),
    )
    .orderBy(people.sortOrder, people.createdAt);
}

export async function lookupFamilyByCode(
  db: Database,
  code: string,
): Promise<FamilyLookup | null> {
  const family = await getFamilyByCode(db, code);
  if (!family) return null;
  return {
    familyId: family.id,
    familyName: family.name,
    members: await pickerMembers(db, family.id),
  };
}

/** Same as {@link lookupFamilyByCode} but keyed by familyId (device memory). */
export async function lookupFamilyById(
  db: Database,
  familyId: string,
): Promise<FamilyLookup | null> {
  const [family] = await db
    .select()
    .from(families)
    .where(eq(families.id, familyId))
    .limit(1);
  if (!family) return null;
  return {
    familyId: family.id,
    familyName: family.name,
    members: await pickerMembers(db, family.id),
  };
}

export type PinResult =
  | { status: "ok"; person: Person }
  | { status: "invalid"; remaining: number }
  | { status: "locked"; until: Date };

/**
 * Verify a member's PIN with lockout. After {@link MAX_PIN_ATTEMPTS} failures
 * the account locks for {@link PIN_LOCK_MS}. A success resets the counter.
 */
export async function verifyPin(
  db: Database,
  familyId: string,
  personId: string,
  pin: string,
  now: Date = new Date(),
): Promise<PinResult> {
  const person = await getPersonById(db, familyId, personId);
  if (!person || !person.isActive || !person.pinHash) {
    return { status: "invalid", remaining: MAX_PIN_ATTEMPTS };
  }

  if (person.pinLockedUntil && person.pinLockedUntil > now) {
    return { status: "locked", until: person.pinLockedUntil };
  }

  const ok = await verifySecret(person.pinHash, pin);
  const scope = and(eq(people.familyId, familyId), eq(people.id, personId));

  if (ok) {
    await db
      .update(people)
      .set({ pinFailedAttempts: 0, pinLockedUntil: null })
      .where(scope);
    return { status: "ok", person };
  }

  const attempts = person.pinFailedAttempts + 1;
  if (attempts >= MAX_PIN_ATTEMPTS) {
    const until = new Date(now.getTime() + PIN_LOCK_MS);
    await db
      .update(people)
      .set({ pinFailedAttempts: 0, pinLockedUntil: until })
      .where(scope);
    return { status: "locked", until };
  }

  await db.update(people).set({ pinFailedAttempts: attempts }).where(scope);
  return { status: "invalid", remaining: MAX_PIN_ATTEMPTS - attempts };
}
