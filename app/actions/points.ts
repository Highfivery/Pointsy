"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { requireParent } from "@/lib/auth/session";
import {
  awardChore,
  changePoints,
  undoEarn,
  AlreadyReversedError,
  NotFoundError,
} from "@/lib/points/service";
import { changePointsSchema, undoEarnSchema } from "@/lib/validation/schemas";
import { toFieldErrors, type FormState } from "@/lib/validation/form";
import { notifyPerson } from "@/lib/push/send";
import { getFamilyTimezone } from "@/lib/family/settings";
import { evaluateChallenges } from "@/lib/challenges/service";

async function notifyKidEarned(
  familyId: string,
  kidId: string,
  amount: number,
  reason: string,
) {
  await notifyPerson(getDb(), familyId, kidId, {
    title: "You earned points! 🎉",
    body: `+${amount} for ${reason}`,
    url: "/me",
  });
}

const idSchema = z.string().uuid();

function revalidateFor(kidId: string) {
  revalidatePath("/dashboard");
  revalidatePath(`/award/${kidId}`);
  revalidatePath("/me");
}

/** One-tap chore award (direct form action). */
export async function awardChoreAction(formData: FormData): Promise<void> {
  const session = await requireParent();
  const choreId = idSchema.safeParse(formData.get("choreId"));
  if (!choreId.success) return;

  // The form submits one `kidId` per selected recipient (single case included).
  const kidIds = Array.from(
    new Set(
      formData
        .getAll("kidId")
        .map((v) => idSchema.safeParse(v))
        .filter((r) => r.success)
        .map((r) => r.data),
    ),
  );
  if (kidIds.length === 0) return;

  const tz = await getFamilyTimezone(getDb(), session.familyId);
  for (const kidId of kidIds) {
    const entry = await awardChore(
      getDb(),
      session.familyId,
      kidId,
      choreId.data,
      session.personId,
    );
    await notifyKidEarned(session.familyId, kidId, entry.amount, entry.reason);
    await evaluateChallenges(getDb(), session.familyId, kidId, tz);
    revalidateFor(kidId);
  }
}

/**
 * Award or deduct a custom amount in one action. The amount is always a
 * positive number; `direction` decides the sign and the ledger semantics —
 * awards are `earn` rows (and notify + count toward challenges), deductions are
 * negative `adjust` rows (a correction, not "un-earning").
 */
export async function changePointsAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireParent();
  const parsed = changePointsSchema.safeParse({
    kidId: formData.get("kidId"),
    direction: formData.get("direction"),
    amount: formData.get("amount"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  const { kidId, direction, amount, reason } = parsed.data;

  try {
    await changePoints(
      getDb(),
      session.familyId,
      kidId,
      direction,
      amount,
      reason,
      session.personId,
    );
  } catch {
    return {
      error:
        direction === "award"
          ? "Could not award points. Please try again."
          : "Could not deduct points. Please try again.",
    };
  }

  if (direction === "award") {
    await notifyKidEarned(session.familyId, kidId, amount, reason);
    const tz = await getFamilyTimezone(getDb(), session.familyId);
    await evaluateChallenges(getDb(), session.familyId, kidId, tz);
  }
  revalidateFor(kidId);
  return { ok: true, direction };
}

/**
 * Put back an earned entry from the activity feed (issue #145). Reverses the
 * points with a linked `adjust` row and flips the originating submission, so
 * the chore reads as not complete until it's done and approved again.
 */
export async function undoEarnAction(formData: FormData): Promise<void> {
  const session = await requireParent();
  const parsed = undoEarnSchema.safeParse({ entryId: formData.get("entryId") });
  if (!parsed.success) return;

  let undone;
  try {
    undone = await undoEarn(
      getDb(),
      session.familyId,
      parsed.data.entryId,
      session.personId,
    );
  } catch (err) {
    // Already put back (or gone): the screen is just stale — refresh it.
    if (err instanceof AlreadyReversedError || err instanceof NotFoundError) {
      revalidatePath("/dashboard");
      return;
    }
    throw err;
  }

  await notifyPerson(getDb(), session.familyId, undone.kidId, {
    title: undone.choreId ? "A chore was put back" : "Points were put back",
    body: undone.choreId
      ? `−${undone.amount} · ${undone.reason} needs doing again`
      : `−${undone.amount} · ${undone.reason}`,
    url: "/me",
  });
  revalidateFor(undone.kidId);
}
