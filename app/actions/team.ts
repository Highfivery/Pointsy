"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { requireKid, requireParent } from "@/lib/auth/session";
import { getPersonById } from "@/lib/db/queries";
import { notifyParents, notifyPerson } from "@/lib/push/send";
import {
  proposeTeamRedemption,
  respondTeamInvite,
  cancelTeamRedemption,
  decideTeamRedemption,
  fulfillTeamRedemption,
  TeamRewardError,
} from "@/lib/redemptions/team";
import { toFieldErrors, type FormState } from "@/lib/validation/form";

const idSchema = z.string().uuid();
const decisionSchema = z.enum(["approved", "denied"]);

const proposeSchema = z.object({
  rewardId: z.string().uuid(),
  kidIds: z.array(z.string().uuid()).min(1, "Pick at least one teammate."),
});

/* ------------------------------------------------------------------ kid */

/** A kid proposes a team reward and invites teammates. */
export async function proposeTeamAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireKid();
  const parsed = proposeSchema.safeParse({
    rewardId: formData.get("rewardId"),
    kidIds: formData.getAll("kidIds"),
  });
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  try {
    await proposeTeamRedemption(
      getDb(),
      session.familyId,
      session.personId,
      parsed.data.rewardId,
      parsed.data.kidIds,
    );
  } catch (err) {
    if (err instanceof TeamRewardError) return { error: err.message };
    throw err;
  }
  const me = await getPersonById(getDb(), session.familyId, session.personId);
  for (const kidId of parsed.data.kidIds) {
    await notifyPerson(getDb(), session.familyId, kidId, {
      title: "Team-up invite! 🤝",
      body: `${me?.name ?? "A teammate"} wants to team up for a reward.`,
      url: "/redeem",
    });
  }
  revalidatePath("/redeem");
  revalidatePath("/me");
  return { ok: true };
}

/** A teammate accepts or declines an invite. */
export async function respondTeamAction(formData: FormData): Promise<void> {
  const session = await requireKid();
  const id = idSchema.safeParse(formData.get("teamRedemptionId"));
  const accept = formData.get("accept") === "true";
  if (!id.success) return;
  try {
    await respondTeamInvite(
      getDb(),
      session.familyId,
      id.data,
      session.personId,
      accept,
    );
  } catch (err) {
    if (!(err instanceof TeamRewardError)) throw err;
  }
  if (accept) {
    await notifyParents(getDb(), session.familyId, {
      title: "Team-up ready",
      body: "A team reward is ready for your approval.",
      url: "/dashboard",
    });
  }
  revalidatePath("/redeem");
  revalidatePath("/me");
}

/** The proposer calls off their team-up. */
export async function cancelTeamAction(formData: FormData): Promise<void> {
  const session = await requireKid();
  const id = idSchema.safeParse(formData.get("teamRedemptionId"));
  if (!id.success) return;
  await cancelTeamRedemption(
    getDb(),
    session.familyId,
    id.data,
    session.personId,
  );
  revalidatePath("/redeem");
  revalidatePath("/me");
}

/* --------------------------------------------------------------- parent */

export async function decideTeamAction(formData: FormData): Promise<void> {
  const session = await requireParent();
  const id = idSchema.safeParse(formData.get("teamRedemptionId"));
  const decision = decisionSchema.safeParse(formData.get("decision"));
  if (!id.success || !decision.success) return;
  try {
    await decideTeamRedemption(
      getDb(),
      session.familyId,
      id.data,
      decision.data,
      session.personId,
    );
  } catch (err) {
    if (!(err instanceof TeamRewardError)) throw err;
  }
  revalidatePath("/dashboard");
  revalidatePath("/me");
}

export async function fulfillTeamAction(formData: FormData): Promise<void> {
  const session = await requireParent();
  const id = idSchema.safeParse(formData.get("teamRedemptionId"));
  if (!id.success) return;
  await fulfillTeamRedemption(
    getDb(),
    session.familyId,
    id.data,
    session.personId,
  );
  revalidatePath("/dashboard");
}
