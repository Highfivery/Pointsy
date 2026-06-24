import { and, asc, eq, inArray } from "drizzle-orm";
import type { Database } from "@/lib/db/types";
import { chores, choreAssignees } from "@/lib/db/schema";
import { nextTurn } from "./eligibility";

/** Assignee person ids for one chore, in rotation order. */
export async function getAssigneeIds(
  db: Database,
  choreId: string,
): Promise<string[]> {
  const rows = await db
    .select({ personId: choreAssignees.personId })
    .from(choreAssignees)
    .where(eq(choreAssignees.choreId, choreId))
    .orderBy(asc(choreAssignees.position));
  return rows.map((r) => r.personId);
}

/** Assignee ids for many chores at once, keyed by chore id (rotation order). */
export async function getAssigneesByChore(
  db: Database,
  choreIds: string[],
): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (choreIds.length === 0) return map;
  const rows = await db
    .select({
      choreId: choreAssignees.choreId,
      personId: choreAssignees.personId,
    })
    .from(choreAssignees)
    .where(inArray(choreAssignees.choreId, choreIds))
    .orderBy(asc(choreAssignees.position));
  for (const r of rows) {
    const list = map.get(r.choreId) ?? [];
    list.push(r.personId);
    map.set(r.choreId, list);
  }
  return map;
}

/** Replace a chore's assignee set with `kidIds` (order = rotation order). */
export async function replaceAssignees(
  db: Database,
  choreId: string,
  kidIds: string[],
): Promise<void> {
  await db.delete(choreAssignees).where(eq(choreAssignees.choreId, choreId));
  if (kidIds.length > 0) {
    await db
      .insert(choreAssignees)
      .values(
        kidIds.map((personId, position) => ({ choreId, personId, position })),
      );
  }
}

/**
 * After a chore is completed (earned) by `completedBy`, advance a rotating
 * chore's turn to the next assignee — but only if it was actually their turn
 * ("advance only when done"). No-op for non-rotating chores.
 */
export async function advanceRotationIfDone(
  db: Database,
  familyId: string,
  choreId: string,
  completedBy: string,
): Promise<void> {
  const [chore] = await db
    .select({
      assignment: chores.assignment,
      currentTurnPersonId: chores.currentTurnPersonId,
    })
    .from(chores)
    .where(and(eq(chores.familyId, familyId), eq(chores.id, choreId)))
    .limit(1);
  if (!chore || chore.assignment !== "rotating") return;
  if (chore.currentTurnPersonId !== completedBy) return;

  const assignees = await getAssigneeIds(db, choreId);
  await db
    .update(chores)
    .set({ currentTurnPersonId: nextTurn(assignees, completedBy) })
    .where(and(eq(chores.familyId, familyId), eq(chores.id, choreId)));
}
