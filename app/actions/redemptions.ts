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
  cashInReward,
  refundRedemption,
  InsufficientPointsError,
  DuplicateRequestError,
  TeamOnlyRewardError,
  AlreadyRefundedError,
  RedemptionNotFoundError,
  RedemptionStateError,
} from "@/lib/redemptions/service";
import {
  cashInRewardSchema,
  refundRewardSchema,
} from "@/lib/validation/schemas";
import type { FormState } from "@/lib/validation/form";
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
    // Affordability can change between render and submit, and a double-submit can
    // race an existing pending request; either way the page revalidates and
    // reflects the true state. Re-throw anything unexpected.
    if (
      !(err instanceof InsufficientPointsError) &&
      !(err instanceof DuplicateRequestError)
    ) {
      throw err;
    }
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

  let redemption;
  try {
    redemption = await decideRedemption(
      getDb(),
      session.familyId,
      id.data,
      decision.data,
      session.personId,
    );
  } catch (err) {
    // Already decided (another parent, a cash-in, or the kid cancelled):
    // the dashboard is just stale, so refresh it.
    if (err instanceof RedemptionStateError) {
      revalidatePath("/dashboard");
      return;
    }
    throw err;
  }
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

function revalidateKid(kidId: string) {
  revalidatePath("/dashboard");
  revalidatePath(`/award/${kidId}`);
  revalidatePath("/me");
  revalidatePath("/redeem");
}

export type CashInState = FormState & { message?: string };

/**
 * A parent cashes in a reward for a kid from the award screen's Deduct mode
 * (issue #189). The kid comes from the form but is checked against the
 * session's family in the service; the family never comes from the client.
 */
export async function cashInRewardAction(
  _prev: CashInState,
  formData: FormData,
): Promise<CashInState> {
  const session = await requireParent();
  const parsed = cashInRewardSchema.safeParse({
    kidId: formData.get("kidId"),
    rewardId: formData.get("rewardId"),
    handedOver: formData.get("handedOver") === "on",
  });
  if (!parsed.success) return { error: "Pick a reward to cash in." };
  const { kidId, rewardId, handedOver } = parsed.data;

  let result;
  try {
    result = await cashInReward(
      getDb(),
      session.familyId,
      kidId,
      rewardId,
      session.personId,
      { handedOver },
    );
  } catch (err) {
    if (err instanceof InsufficientPointsError) {
      revalidateKid(kidId);
      return { error: "Not enough points available for that reward." };
    }
    if (err instanceof TeamOnlyRewardError) return { error: err.message };
    if (err instanceof RedemptionNotFoundError) {
      revalidateKid(kidId);
      return { error: "That reward isn't available any more." };
    }
    throw err;
  }

  const { rewardName, cost } = result.redemption;
  await notifyPerson(getDb(), session.familyId, kidId, {
    title: `You got ${rewardName}! 🎁`,
    body: `−${cost} points`,
    url: "/me",
  });
  revalidateKid(kidId);
  return {
    ok: true,
    message: handedOver
      ? `${rewardName} cashed in.`
      : `${rewardName} cashed in. It's in Awaiting delivery on your dashboard.`,
  };
}

/** Refund a paid-for reward from a kid's activity feed. */
export async function refundRewardAction(formData: FormData): Promise<void> {
  const session = await requireParent();
  const parsed = refundRewardSchema.safeParse({
    entryId: formData.get("entryId"),
  });
  if (!parsed.success) return;

  let refunded;
  try {
    refunded = await refundRedemption(
      getDb(),
      session.familyId,
      parsed.data.entryId,
      session.personId,
    );
  } catch (err) {
    // Already refunded (or gone): the screen is stale — refresh it.
    if (
      err instanceof AlreadyRefundedError ||
      err instanceof RedemptionNotFoundError
    ) {
      revalidatePath("/dashboard");
      return;
    }
    throw err;
  }
  await notifyPerson(getDb(), session.familyId, refunded.kidId, {
    title: "Points given back",
    body: `+${refunded.amount} · ${refunded.rewardName} was refunded`,
    url: "/me",
  });
  revalidateKid(refunded.kidId);
}
