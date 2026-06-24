/**
 * Pure chore-assignment logic (no I/O — unit tested). Decides whether a given
 * kid may do a chore right now, and how a "rotating" turn advances.
 */
import type { ChoreAssignment } from "@/lib/db/schema";

export interface AssignmentState {
  assignment: ChoreAssignment;
  /** Assigned kids in rotation order (empty for "everyone"). */
  assigneeIds: readonly string[];
  /** For "rotating": whose turn it is now. */
  currentTurnPersonId: string | null;
}

export interface Eligibility {
  allowed: boolean;
  /** Why it's locked for this kid, e.g. "Robin's turn" (null when allowed). */
  reason: string | null;
}

/** Whether `kidId` may log/claim the chore now, with a reason when locked. */
export function eligibleFor(
  state: AssignmentState,
  kidId: string,
  nameOf: (personId: string) => string,
): Eligibility {
  if (state.assignment === "everyone") return { allowed: true, reason: null };

  if (state.assignment === "specific") {
    return state.assigneeIds.includes(kidId)
      ? { allowed: true, reason: null }
      : { allowed: false, reason: "Not your chore" };
  }

  // rotating
  if (state.currentTurnPersonId === kidId) {
    return { allowed: true, reason: null };
  }
  const who = state.currentTurnPersonId
    ? nameOf(state.currentTurnPersonId)
    : null;
  return {
    allowed: false,
    reason: who ? `${who}'s turn` : "Not your turn yet",
  };
}

/**
 * The next kid's turn after `current` completes a rotating chore (wraps around).
 * Returns the first assignee when there's no valid current turn.
 */
export function nextTurn(
  assigneeIds: readonly string[],
  current: string | null,
): string | null {
  if (assigneeIds.length === 0) return null;
  const idx = current ? assigneeIds.indexOf(current) : -1;
  return assigneeIds[(idx + 1) % assigneeIds.length];
}

/**
 * The starting turn for a rotating chore: keep the current kid if they're still
 * an assignee, otherwise the first assignee.
 */
export function initialTurn(
  assigneeIds: readonly string[],
  current: string | null,
): string | null {
  if (assigneeIds.length === 0) return null;
  if (current && assigneeIds.includes(current)) return current;
  return assigneeIds[0];
}
