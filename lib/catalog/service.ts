import { and, eq } from "drizzle-orm";
import type { Database } from "@/lib/db/types";
import { chores, rewards, type Chore, type Reward } from "@/lib/db/schema";

/**
 * Catalog services for the chore and reward catalogs. All functions take an
 * explicit `db` (testable with PGlite) and are scoped by `familyId`.
 * Items are returned in display order; lists include inactive items so parents
 * can manage them.
 */

export interface ChoreInput {
  name: string;
  emoji: string;
  points: number;
}

export interface RewardInput {
  name: string;
  emoji: string;
  cost: number;
  description?: string;
}

export type MoveDirection = "up" | "down";

/* --------------------------------------------------------------- chores */

export async function listChores(
  db: Database,
  familyId: string,
): Promise<Chore[]> {
  return db
    .select()
    .from(chores)
    .where(eq(chores.familyId, familyId))
    .orderBy(chores.sortOrder, chores.createdAt);
}

export async function createChore(
  db: Database,
  familyId: string,
  input: ChoreInput,
): Promise<Chore> {
  const existing = await listChores(db, familyId);
  const [row] = await db
    .insert(chores)
    .values({
      familyId,
      name: input.name.trim(),
      emoji: input.emoji,
      points: input.points,
      sortOrder: existing.length,
    })
    .returning();
  return row;
}

export async function updateChore(
  db: Database,
  familyId: string,
  id: string,
  input: ChoreInput,
): Promise<void> {
  await db
    .update(chores)
    .set({ name: input.name.trim(), emoji: input.emoji, points: input.points })
    .where(and(eq(chores.familyId, familyId), eq(chores.id, id)));
}

export async function toggleChoreActive(
  db: Database,
  familyId: string,
  id: string,
  isActive: boolean,
): Promise<void> {
  await db
    .update(chores)
    .set({ isActive })
    .where(and(eq(chores.familyId, familyId), eq(chores.id, id)));
}

export async function deleteChore(
  db: Database,
  familyId: string,
  id: string,
): Promise<void> {
  await db
    .delete(chores)
    .where(and(eq(chores.familyId, familyId), eq(chores.id, id)));
}

export async function moveChore(
  db: Database,
  familyId: string,
  id: string,
  direction: MoveDirection,
): Promise<void> {
  const items = await listChores(db, familyId);
  const idx = items.findIndex((c) => c.id === id);
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (idx < 0 || swapIdx < 0 || swapIdx >= items.length) return;

  const a = items[idx];
  const b = items[swapIdx];
  await db.transaction(async (tx) => {
    await tx
      .update(chores)
      .set({ sortOrder: b.sortOrder })
      .where(and(eq(chores.familyId, familyId), eq(chores.id, a.id)));
    await tx
      .update(chores)
      .set({ sortOrder: a.sortOrder })
      .where(and(eq(chores.familyId, familyId), eq(chores.id, b.id)));
  });
}

/* -------------------------------------------------------------- rewards */

export async function listRewards(
  db: Database,
  familyId: string,
): Promise<Reward[]> {
  return db
    .select()
    .from(rewards)
    .where(eq(rewards.familyId, familyId))
    .orderBy(rewards.sortOrder, rewards.createdAt);
}

export async function createReward(
  db: Database,
  familyId: string,
  input: RewardInput,
): Promise<Reward> {
  const existing = await listRewards(db, familyId);
  const [row] = await db
    .insert(rewards)
    .values({
      familyId,
      name: input.name.trim(),
      emoji: input.emoji,
      cost: input.cost,
      description: input.description?.trim() || null,
      sortOrder: existing.length,
    })
    .returning();
  return row;
}

export async function updateReward(
  db: Database,
  familyId: string,
  id: string,
  input: RewardInput,
): Promise<void> {
  await db
    .update(rewards)
    .set({
      name: input.name.trim(),
      emoji: input.emoji,
      cost: input.cost,
      description: input.description?.trim() || null,
    })
    .where(and(eq(rewards.familyId, familyId), eq(rewards.id, id)));
}

export async function toggleRewardActive(
  db: Database,
  familyId: string,
  id: string,
  isActive: boolean,
): Promise<void> {
  await db
    .update(rewards)
    .set({ isActive })
    .where(and(eq(rewards.familyId, familyId), eq(rewards.id, id)));
}

export async function deleteReward(
  db: Database,
  familyId: string,
  id: string,
): Promise<void> {
  await db
    .delete(rewards)
    .where(and(eq(rewards.familyId, familyId), eq(rewards.id, id)));
}

export async function moveReward(
  db: Database,
  familyId: string,
  id: string,
  direction: MoveDirection,
): Promise<void> {
  const items = await listRewards(db, familyId);
  const idx = items.findIndex((r) => r.id === id);
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (idx < 0 || swapIdx < 0 || swapIdx >= items.length) return;

  const a = items[idx];
  const b = items[swapIdx];
  await db.transaction(async (tx) => {
    await tx
      .update(rewards)
      .set({ sortOrder: b.sortOrder })
      .where(and(eq(rewards.familyId, familyId), eq(rewards.id, a.id)));
    await tx
      .update(rewards)
      .set({ sortOrder: a.sortOrder })
      .where(and(eq(rewards.familyId, familyId), eq(rewards.id, b.id)));
  });
}
