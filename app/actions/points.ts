"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { requireParent } from "@/lib/auth/session";
import { awardChore, awardCustom, adjustPoints } from "@/lib/points/service";
import { changePointsSchema } from "@/lib/validation/schemas";
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
    if (direction === "award") {
      await awardCustom(
        getDb(),
        session.familyId,
        kidId,
        amount,
        reason,
        session.personId,
      );
    } else {
      await adjustPoints(
        getDb(),
        session.familyId,
        kidId,
        -amount,
        reason,
        session.personId,
      );
    }
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
