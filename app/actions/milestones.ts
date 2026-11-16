"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { requireParent } from "@/lib/auth/session";
import { milestoneSchema } from "@/lib/validation/schemas";
import { toFieldErrors, type FormState } from "@/lib/validation/form";
import {
  createMilestone,
  updateMilestone,
  setMilestoneActive,
  deleteMilestone,
  fulfillUnlock,
  MilestoneLockedError,
} from "@/lib/milestones/service";
import { afterMilestoneChange } from "@/lib/points/after-earn";

const idSchema = z.string().uuid();

function revalidateMilestones() {
  revalidatePath("/manage/milestones");
  revalidatePath("/dashboard");
  revalidatePath("/me");
}

/** Create or update a milestone from the editor, then return to the list. */
export async function saveMilestoneAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireParent();
  const parsed = milestoneSchema.safeParse({
    title: formData.get("title"),
    reward: formData.get("reward"),
    target: formData.get("target"),
    repeats: formData.get("repeats") ?? "once",
    startMode: formData.get("startMode") ?? "lifetime",
    who: formData.get("who") ?? "all",
    kidIds: formData.getAll("kidIds"),
  });
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  const db = getDb();
  const rawId = formData.get("id");
  if (typeof rawId === "string" && rawId.length > 0) {
    const id = idSchema.safeParse(rawId);
    if (!id.success) return { error: "Could not find that milestone." };
    try {
      await updateMilestone(db, session.familyId, id.data, parsed.data);
    } catch (err) {
      if (err instanceof MilestoneLockedError) return { error: err.message };
      throw err;
    }
  } else {
    await createMilestone(db, session.familyId, parsed.data, session.personId);
  }
  // A kid may already be past the target ("all points so far"), so check now.
  await afterMilestoneChange(db, session.familyId);
  revalidateMilestones();
  redirect("/manage/milestones");
}

/** Pause/resume a milestone (stays on the page). */
export async function setMilestoneActiveAction(
  formData: FormData,
): Promise<void> {
  const session = await requireParent();
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return;
  const isActive = formData.get("isActive") === "true";
  const db = getDb();
  await setMilestoneActive(db, session.familyId, id.data, isActive);
  // Resuming catches up anything reached while paused.
  if (isActive) await afterMilestoneChange(db, session.familyId);
  revalidateMilestones();
}

/** Delete a milestone (owed rewards stay on the dashboard), then go back. */
export async function deleteMilestoneAction(formData: FormData): Promise<void> {
  const session = await requireParent();
  const id = idSchema.safeParse(formData.get("id"));
  if (id.success) {
    await deleteMilestone(getDb(), session.familyId, id.data);
    revalidateMilestones();
  }
  redirect("/manage/milestones");
}

/** Mark an unlocked milestone reward as handed out. */
export async function fulfillUnlockAction(formData: FormData): Promise<void> {
  const session = await requireParent();
  const id = idSchema.safeParse(formData.get("unlockId"));
  if (!id.success) return;
  await fulfillUnlock(getDb(), session.familyId, id.data, session.personId);
  revalidateMilestones();
}
