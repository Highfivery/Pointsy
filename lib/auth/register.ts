import { eq } from "drizzle-orm";
import type { Database } from "@/lib/db/types";
import { families, people, type Family, type Person } from "@/lib/db/schema";
import { hashSecret, verifySecret } from "./password";
import { generateFamilyCode } from "./family-code";
import { DEFAULT_PARENT_AVATAR_ICON } from "@/lib/icons";

/** Bump when the ToS/Privacy wording materially changes (recorded per parent). */
export const CONSENT_VERSION = "2026-06-22";

export class EmailTakenError extends Error {
  constructor() {
    super("That email is already in use.");
    this.name = "EmailTakenError";
  }
}

export interface RegisterFamilyInput {
  familyName: string;
  parentName: string;
  email: string;
  password: string;
}

export interface RegisterFamilyResult {
  familyId: string;
  personId: string;
  familyCode: string;
}

/** Create a family with a collision-free join code (inside the open tx). */
async function insertFamilyWithUniqueCode(
  tx: Database,
  name: string,
): Promise<Family> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateFamilyCode(name);
    const existing = await tx
      .select({ id: families.id })
      .from(families)
      .where(eq(families.code, code))
      .limit(1);
    if (existing.length === 0) {
      const [family] = await tx
        .insert(families)
        .values({ name, code })
        .returning();
      return family;
    }
  }
  throw new Error("Could not generate a unique family code");
}

/**
 * Register a new family and its first parent (the account owner). Records
 * guardian consent. Throws {@link EmailTakenError} if the email is taken.
 */
export async function registerFamily(
  db: Database,
  input: RegisterFamilyInput,
): Promise<RegisterFamilyResult> {
  const email = input.email.trim().toLowerCase();

  const existing = await db
    .select({ id: people.id })
    .from(people)
    .where(eq(people.email, email))
    .limit(1);
  if (existing.length > 0) throw new EmailTakenError();

  const passwordHash = await hashSecret(input.password);

  return db.transaction(async (tx) => {
    const family = await insertFamilyWithUniqueCode(
      tx,
      input.familyName.trim(),
    );
    const [parent] = await tx
      .insert(people)
      .values({
        familyId: family.id,
        role: "parent",
        name: input.parentName.trim(),
        avatar: DEFAULT_PARENT_AVATAR_ICON,
        email,
        passwordHash,
        consentAt: new Date(),
        consentVersion: CONSENT_VERSION,
      })
      .returning();

    // The creating parent is the protected family owner.
    await tx
      .update(families)
      .set({ ownerId: parent.id })
      .where(eq(families.id, family.id));

    return {
      familyId: family.id,
      personId: parent.id,
      familyCode: family.code,
    };
  });
}

/**
 * Verify a parent's email + password. Returns the parent row on success, or
 * null on any failure (unknown email, no password set, or bad password).
 */
export async function authenticateParent(
  db: Database,
  email: string,
  password: string,
): Promise<Person | null> {
  const [parent] = await db
    .select()
    .from(people)
    .where(eq(people.email, email.trim().toLowerCase()))
    .limit(1);

  if (
    !parent ||
    parent.role !== "parent" ||
    !parent.passwordHash ||
    !parent.isActive
  ) {
    return null;
  }

  const ok = await verifySecret(parent.passwordHash, password);
  return ok ? parent : null;
}
