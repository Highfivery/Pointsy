import { and, eq, gt, isNull, desc } from "drizzle-orm";
import type { Database } from "@/lib/db/types";
import { families, people, parentInvites } from "@/lib/db/schema";
import { hashSecret } from "@/lib/auth/password";
import { generateInviteCode, hashInviteCode } from "@/lib/auth/invite-code";
import { EmailTakenError, CONSENT_VERSION } from "@/lib/auth/register";
import { DEFAULT_PARENT_AVATAR_ICON } from "@/lib/icons";

/** Invite lifetime (72h), single-use. */
export const INVITE_TTL_MS = 72 * 60 * 60 * 1000;

export class InviteInvalidError extends Error {
  constructor() {
    super("That invite code is invalid or has expired.");
    this.name = "InviteInvalidError";
  }
}

export class NotOwnerError extends Error {
  constructor() {
    super("Only the family owner can do that.");
    this.name = "NotOwnerError";
  }
}

export class CannotRemoveParentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CannotRemoveParentError";
  }
}

export interface ParentSummary {
  id: string;
  name: string;
  email: string | null;
  isOwner: boolean;
  createdAt: Date;
}

async function getOwnerId(
  db: Database,
  familyId: string,
): Promise<string | null> {
  const [family] = await db
    .select({ ownerId: families.ownerId })
    .from(families)
    .where(eq(families.id, familyId))
    .limit(1);
  return family?.ownerId ?? null;
}

/** Active parents in a family, oldest first, flagged with who's the owner. */
export async function listParents(
  db: Database,
  familyId: string,
): Promise<ParentSummary[]> {
  const ownerId = await getOwnerId(db, familyId);
  const rows = await db
    .select({
      id: people.id,
      name: people.name,
      email: people.email,
      createdAt: people.createdAt,
    })
    .from(people)
    .where(
      and(
        eq(people.familyId, familyId),
        eq(people.role, "parent"),
        eq(people.isActive, true),
      ),
    )
    .orderBy(people.createdAt, people.id);
  return rows.map((r) => ({ ...r, isOwner: r.id === ownerId }));
}

export interface PendingInvite {
  id: string;
  expiresAt: Date;
  createdAt: Date;
}

/** Non-redeemed, non-expired invites for a family. */
export async function listPendingInvites(
  db: Database,
  familyId: string,
  now: Date = new Date(),
): Promise<PendingInvite[]> {
  return db
    .select({
      id: parentInvites.id,
      expiresAt: parentInvites.expiresAt,
      createdAt: parentInvites.createdAt,
    })
    .from(parentInvites)
    .where(
      and(
        eq(parentInvites.familyId, familyId),
        isNull(parentInvites.redeemedAt),
        gt(parentInvites.expiresAt, now),
      ),
    )
    .orderBy(desc(parentInvites.createdAt));
}

/** Create a one-time invite. Returns the plaintext code (shown once) + expiry. */
export async function createParentInvite(
  db: Database,
  familyId: string,
  createdBy: string,
  now: Date = new Date(),
): Promise<{ code: string; expiresAt: Date }> {
  const code = generateInviteCode();
  const expiresAt = new Date(now.getTime() + INVITE_TTL_MS);
  await db.insert(parentInvites).values({
    familyId,
    codeHash: hashInviteCode(code),
    createdBy,
    expiresAt,
  });
  return { code, expiresAt };
}

export async function revokeParentInvite(
  db: Database,
  familyId: string,
  inviteId: string,
): Promise<void> {
  await db
    .delete(parentInvites)
    .where(
      and(
        eq(parentInvites.id, inviteId),
        eq(parentInvites.familyId, familyId),
        isNull(parentInvites.redeemedAt),
      ),
    );
}

export interface RedeemInviteInput {
  code: string;
  name: string;
  email: string;
  password: string;
}

/**
 * Redeem an invite by creating a new parent (with their own consent) in the
 * invite's family. Single-use and expiry-checked inside the transaction.
 * Throws {@link InviteInvalidError} or {@link EmailTakenError}.
 */
export async function redeemParentInvite(
  db: Database,
  input: RedeemInviteInput,
  now: Date = new Date(),
): Promise<{ familyId: string; personId: string }> {
  const codeHash = hashInviteCode(input.code);
  const email = input.email.trim().toLowerCase();
  const passwordHash = await hashSecret(input.password);

  return db.transaction(async (tx) => {
    const [invite] = await tx
      .select()
      .from(parentInvites)
      .where(
        and(
          eq(parentInvites.codeHash, codeHash),
          isNull(parentInvites.redeemedAt),
          gt(parentInvites.expiresAt, now),
        ),
      )
      .limit(1);
    if (!invite) throw new InviteInvalidError();

    const dupe = await tx
      .select({ id: people.id })
      .from(people)
      .where(eq(people.email, email))
      .limit(1);
    if (dupe.length > 0) throw new EmailTakenError();

    const [parent] = await tx
      .insert(people)
      .values({
        familyId: invite.familyId,
        role: "parent",
        name: input.name.trim(),
        avatar: DEFAULT_PARENT_AVATAR_ICON,
        email,
        passwordHash,
        consentAt: now,
        consentVersion: CONSENT_VERSION,
      })
      .returning();

    await tx
      .update(parentInvites)
      .set({ redeemedAt: now, redeemedBy: parent.id })
      .where(eq(parentInvites.id, invite.id));

    return { familyId: invite.familyId, personId: parent.id };
  });
}

/**
 * Deactivate a co-parent. Owner-only; the owner can't be removed. Keeps the
 * family with at least one parent (the owner always remains).
 */
export async function removeParent(
  db: Database,
  familyId: string,
  requestorId: string,
  targetId: string,
): Promise<void> {
  const ownerId = await getOwnerId(db, familyId);
  if (!ownerId || ownerId !== requestorId) throw new NotOwnerError();
  if (targetId === ownerId) {
    throw new CannotRemoveParentError("You can't remove the family owner.");
  }

  const [target] = await db
    .select({ id: people.id })
    .from(people)
    .where(
      and(
        eq(people.id, targetId),
        eq(people.familyId, familyId),
        eq(people.role, "parent"),
        eq(people.isActive, true),
      ),
    )
    .limit(1);
  if (!target) throw new CannotRemoveParentError("That parent wasn't found.");

  await db
    .update(people)
    .set({ isActive: false })
    .where(eq(people.id, targetId));
}
