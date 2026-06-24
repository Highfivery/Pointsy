"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { requireKid, requireParent } from "@/lib/auth/session";
import {
  requestRedemption,
  cancelRedemption,
  decideRedemption,
  fulfillRedemption,
  setKidGoal,
  InsufficientPointsError,
} from "@/lib/redemptions/service";
import { getPersonById } from "@/lib/db/queries";
import { notifyParents, notifyPerson } from "@/lib/push/send";

const idSchema = z.string().uuid();
const decisionSchema = z.enum(["approved", "denied"]);

/* ------------------------------------------------------------------ kid */

export async function requestRedemptionAction(
  formData: FormData,
): Promise<void> {
  const session = await requireKid();
  const rewardId = idSchema.safeParse(formData.get("rewardId"));
  if (!rewardId.success) return;

  let redemption;
  try {
    redemption = await requestRedemption(
      getDb(),
      session.familyId,
      session.personId,
      rewardId.data,
    );
  } catch (err) {
    // Affordability can change between render and submit; the page revalidates
    // and reflects the new state. Re-throw anything unexpected.
    if (!(err instanceof InsufficientPointsError)) throw err;
  }

  if (redemption) {
    const kid = await getPersonById(
      getDb(),
      session.familyId,
      session.personId,
    );
    await notifyParents(getDb(), session.familyId, {
      title: "Reward requested",
      body: `${kid?.name ?? "A child"} wants ${redemption.rewardName}`,
      url: "/dashboard",
    });
  }
  revalidatePath("/redeem");
  revalidatePath("/me");
}

export async function cancelRedemptionAction(
  formData: FormData,
): Promise<void> {
  const session = await requireKid();
  const id = idSchema.safeParse(formData.get("redemptionId"));
  if (!id.success) return;
  await cancelRedemption(getDb(), session.familyId, id.data, session.personId);
  revalidatePath("/redeem");
  revalidatePath("/me");
}

/** Set or clear the kid's savings-goal reward (empty value clears it). */
export async function setGoalAction(formData: FormData): Promise<void> {
  const session = await requireKid();
  const raw = formData.get("rewardId");
  const rewardId =
    typeof raw === "string" && raw.length > 0 ? idSchema.safeParse(raw) : null;
  if (rewardId && !rewardId.success) return;
  await setKidGoal(
    getDb(),
    session.familyId,
    session.personId,
    rewardId ? rewardId.data : null,
  );
  revalidatePath("/me");
}

/* --------------------------------------------------------------- parent */

export async function decideRedemptionAction(
  formData: FormData,
): Promise<void> {
  const session = await requireParent();
  const id = idSchema.safeParse(formData.get("redemptionId"));
  const decision = decisionSchema.safeParse(formData.get("decision"));
  if (!id.success || !decision.success) return;

  const redemption = await decideRedemption(
    getDb(),
    session.familyId,
    id.data,
    decision.data,
    session.personId,
  );
  if (decision.data === "approved") {
    await notifyPerson(getDb(), session.familyId, redemption.personId, {
      title: "Reward approved! 🎉",
      body: `Your ${redemption.rewardName} was approved.`,
      url: "/me",
    });
  }
  revalidatePath("/dashboard");
}

export async function fulfillRedemptionAction(
  formData: FormData,
): Promise<void> {
  const session = await requireParent();
  const id = idSchema.safeParse(formData.get("redemptionId"));
  if (!id.success) return;
  await fulfillRedemption(getDb(), session.familyId, id.data, session.personId);
  revalidatePath("/dashboard");
}
