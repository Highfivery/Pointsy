"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { requireParent } from "@/lib/auth/session";
import { awardChore, awardCustom, adjustPoints } from "@/lib/points/service";
import { customAwardSchema, adjustSchema } from "@/lib/validation/schemas";
import { toFieldErrors, type FormState } from "@/lib/validation/form";
import { notifyPerson } from "@/lib/push/send";

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

  for (const kidId of kidIds) {
    const entry = await awardChore(
      getDb(),
      session.familyId,
      kidId,
      choreId.data,
      session.personId,
    );
    await notifyKidEarned(session.familyId, kidId, entry.amount, entry.reason);
    revalidateFor(kidId);
  }
}

export async function awardCustomAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireParent();
  const parsed = customAwardSchema.safeParse({
    kidId: formData.get("kidId"),
    amount: formData.get("amount"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  try {
    await awardCustom(
      getDb(),
      session.familyId,
      parsed.data.kidId,
      parsed.data.amount,
      parsed.data.reason,
      session.personId,
    );
  } catch {
    return { error: "Could not award points. Please try again." };
  }
  await notifyKidEarned(
    session.familyId,
    parsed.data.kidId,
    parsed.data.amount,
    parsed.data.reason,
  );
  revalidateFor(parsed.data.kidId);
  return { ok: true };
}

export async function adjustPointsAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireParent();
  const parsed = adjustSchema.safeParse({
    kidId: formData.get("kidId"),
    amount: formData.get("amount"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  try {
    await adjustPoints(
      getDb(),
      session.familyId,
      parsed.data.kidId,
      parsed.data.amount,
      parsed.data.reason,
      session.personId,
    );
  } catch {
    return { error: "Could not adjust points. Please try again." };
  }
  revalidateFor(parsed.data.kidId);
  return { ok: true };
}
