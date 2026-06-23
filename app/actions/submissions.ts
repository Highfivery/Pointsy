"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { requireKid, requireParent } from "@/lib/auth/session";
import { getFamilyTimezone } from "@/lib/family/settings";
import { getPersonById } from "@/lib/db/queries";
import {
  submitChore,
  cancelSubmission,
  decideSubmission,
  LimitReachedError,
  InvalidSubmissionError,
} from "@/lib/submissions/service";
import { notifyParents, notifyPerson } from "@/lib/push/send";

const idSchema = z.string().uuid();
const decisionSchema = z.enum(["approved", "rejected"]);

/** Kid logs a completed chore (pending parent approval). */
export async function submitChoreAction(formData: FormData): Promise<void> {
  const session = await requireKid();
  const choreId = idSchema.safeParse(formData.get("choreId"));
  if (!choreId.success) return;

  const db = getDb();
  const tz = await getFamilyTimezone(db, session.familyId);
  try {
    await submitChore(db, session.familyId, session.personId, choreId.data, tz);
  } catch (err) {
    // Limit can be hit between render and submit; the screen revalidates.
    if (
      err instanceof LimitReachedError ||
      err instanceof InvalidSubmissionError
    ) {
      revalidatePath("/submit");
      return;
    }
    throw err;
  }

  const kid = await getPersonById(db, session.familyId, session.personId);
  await notifyParents(db, session.familyId, {
    title: "Chore to review",
    body: `${kid?.name ?? "A child"} logged a chore`,
    url: "/dashboard",
  });
  revalidatePath("/submit");
  revalidatePath("/me");
  revalidatePath("/dashboard");

  // Outside the try/catch: redirect() throws a control-flow signal by design.
  redirect("/me");
}

/** Kid withdraws their own still-pending submission. */
export async function cancelSubmissionAction(
  formData: FormData,
): Promise<void> {
  const session = await requireKid();
  const id = idSchema.safeParse(formData.get("submissionId"));
  if (!id.success) return;
  await cancelSubmission(getDb(), session.familyId, session.personId, id.data);
  revalidatePath("/me");
  revalidatePath("/submit");
  revalidatePath("/dashboard");
}

/** Parent approves (→ points) or rejects a pending submission. */
export async function decideSubmissionAction(
  formData: FormData,
): Promise<void> {
  const session = await requireParent();
  const id = idSchema.safeParse(formData.get("submissionId"));
  const decision = decisionSchema.safeParse(formData.get("decision"));
  if (!id.success || !decision.success) return;

  const db = getDb();
  let decided;
  try {
    decided = await decideSubmission(
      db,
      session.familyId,
      id.data,
      decision.data,
      session.personId,
    );
  } catch (err) {
    if (err instanceof InvalidSubmissionError) {
      revalidatePath("/dashboard");
      return;
    }
    throw err;
  }

  if (decision.data === "approved") {
    await notifyPerson(db, session.familyId, decided.personId, {
      title: "Chore approved! 🎉",
      body: `+${decided.points} for ${decided.choreName}`,
      url: "/me",
    });
  } else {
    await notifyPerson(db, session.familyId, decided.personId, {
      title: "Chore not approved",
      body: `Your "${decided.choreName}" wasn't approved this time.`,
      url: "/me",
    });
  }
  revalidatePath("/dashboard");
  revalidatePath("/me");
}
