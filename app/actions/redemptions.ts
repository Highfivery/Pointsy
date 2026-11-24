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
import { formatNameList } from "@/lib/domain/names";
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
 * A parent cashes in a reward from the award screen's Deduct mode (issue
 * #189) for the screen's kid plus any "Also give to" picks. Each kid gets the
 * reward and pays its full cost in their own transaction, with every rule
 * checked per kid; a kid who can't have it is skipped and named in the
 * message. Kids are checked against the session's family in the service — the
 * family never comes from the client.
 */
export async function cashInRewardAction(
  _prev: CashInState,
  formData: FormData,
): Promise<CashInState> {
  const session = await requireParent();
  const parsed = cashInRewardSchema.safeParse({
    kidIds: formData.getAll("kidId"),
    rewardId: formData.get("rewardId"),
    handedOver: formData.get("handedOver") === "on",
  });
  if (!parsed.success) return { error: "Pick a reward to cash in." };
  const { kidIds, rewardId, handedOver } = parsed.data;
  const db = getDb();

  const done: string[] = [];
  const skipped: string[] = [];
  let rewardName = "";
  let cost = 0;
  for (const kidId of kidIds) {
    const kid = await getPersonById(db, session.familyId, kidId);
    const name = kid?.name ?? "A child";
    try {
      const result = await cashInReward(
        db,
        session.familyId,
        kidId,
        rewardId,
        session.personId,
        { handedOver },
      );
      ({ rewardName, cost } = result.redemption);
      done.push(name);
      await notifyPerson(db, session.familyId, kidId, {
        title: `You got ${rewardName}! 🎁`,
        body: `−${cost} points`,
        url: "/me",
      });
    } catch (err) {
      if (err instanceof InsufficientPointsError) {
        skipped.push(`${name} (not enough points)`);
      } else if (
        err instanceof TeamOnlyRewardError ||
        err instanceof RedemptionNotFoundError
      ) {
        skipped.push(`${name} (not available)`);
      } else {
        throw err;
      }
    }
    revalidateKid(kidId);
  }

  if (done.length === 0) {
    return {
      error:
        kidIds.length === 1
          ? skipped[0]?.includes("not enough")
            ? "Not enough points available for that reward."
            : "That reward isn't available any more."
          : `Nobody could have it: ${formatNameList(skipped)}.`,
    };
  }
  const forWho = kidIds.length > 1 ? ` for ${formatNameList(done)}` : "";
  const later = handedOver
    ? ""
    : " It's in Awaiting delivery on your dashboard.";
  const skippedNote =
    skipped.length > 0 ? ` Skipped ${formatNameList(skipped)}.` : "";
  return {
    ok: true,
    message: `${rewardName} cashed in${forWho}.${later}${skippedNote}`,
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
