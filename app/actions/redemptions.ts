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
  InsufficientPointsError,
} from "@/lib/redemptions/service";

const idSchema = z.string().uuid();
const decisionSchema = z.enum(["approved", "denied"]);

/* ------------------------------------------------------------------ kid */

export async function requestRedemptionAction(
  formData: FormData,
): Promise<void> {
  const session = await requireKid();
  const rewardId = idSchema.safeParse(formData.get("rewardId"));
  if (!rewardId.success) return;

  try {
    await requestRedemption(
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

/* --------------------------------------------------------------- parent */

export async function decideRedemptionAction(
  formData: FormData,
): Promise<void> {
  const session = await requireParent();
  const id = idSchema.safeParse(formData.get("redemptionId"));
  const decision = decisionSchema.safeParse(formData.get("decision"));
  if (!id.success || !decision.success) return;

  await decideRedemption(
    getDb(),
    session.familyId,
    id.data,
    decision.data,
    session.personId,
  );
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
