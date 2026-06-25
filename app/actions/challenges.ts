"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { requireParent } from "@/lib/auth/session";
import { challengeSchema } from "@/lib/validation/schemas";
import { toFieldErrors, type FormState } from "@/lib/validation/form";
import {
  createChallenge,
  updateChallenge,
  setChallengeActive,
  deleteChallenge,
} from "@/lib/challenges/service";

const idSchema = z.string().uuid();

function parseChallenge(formData: FormData) {
  return challengeSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    scope: formData.get("scope") ?? "kid",
    recurrence: formData.get("recurrence") ?? "none",
    goalType: formData.get("goalType"),
    goalTarget: formData.get("goalTarget"),
    bonusPoints: formData.get("bonusPoints"),
    startsOn: formData.get("startsOn"),
    endsOn: formData.get("endsOn"),
    kidIds: formData.getAll("kidIds"),
  });
}

/** Create or update a challenge from the editor, then return to the list. */
export async function saveChallengeAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireParent();
  const parsed = parseChallenge(formData);
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  const rawId = formData.get("id");
  if (typeof rawId === "string" && rawId.length > 0) {
    const id = idSchema.safeParse(rawId);
    if (!id.success) return { error: "Could not find that challenge." };
    await updateChallenge(getDb(), session.familyId, id.data, parsed.data);
  } else {
    await createChallenge(
      getDb(),
      session.familyId,
      parsed.data,
      session.personId,
    );
  }
  revalidatePath("/manage/challenges");
  redirect("/manage/challenges");
}

/** Pause/resume a challenge (stays on the page). */
export async function setChallengeActiveAction(
  formData: FormData,
): Promise<void> {
  const session = await requireParent();
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return;
  await setChallengeActive(
    getDb(),
    session.familyId,
    id.data,
    formData.get("isActive") === "true",
  );
  revalidatePath("/manage/challenges");
}

/** Delete a challenge, then return to the list. */
export async function deleteChallengeAction(formData: FormData): Promise<void> {
  const session = await requireParent();
  const id = idSchema.safeParse(formData.get("id"));
  if (id.success) {
    await deleteChallenge(getDb(), session.familyId, id.data);
    revalidatePath("/manage/challenges");
  }
  redirect("/manage/challenges");
}
