import "server-only";
import type { Database } from "@/lib/db/types";
import { evaluateChallenges } from "@/lib/challenges/service";
import {
  evaluateMilestones,
  evaluateMilestonesForFamily,
  type NewUnlock,
} from "@/lib/milestones/service";
import { notifyParents, notifyPerson } from "@/lib/push/send";

/**
 * Tell parents and the kid about newly reached milestones. Best-effort: push
 * never throws, so an earn can't fail because a notification did.
 */
export async function notifyUnlocks(
  db: Database,
  familyId: string,
  unlocks: readonly NewUnlock[],
): Promise<void> {
  for (const u of unlocks) {
    await notifyParents(db, familyId, {
      title: `${u.kidName} reached a milestone 🏁`,
      body: `${u.title}: ${u.reward}`,
      url: "/dashboard",
    });
    await notifyPerson(db, familyId, u.personId, {
      title: "Milestone reached! 🏁",
      body: `${u.title}: ${u.reward}. A grown-up will hand it out.`,
      url: "/me",
    });
  }
}

/**
 * Run everything that follows points being earned, for each kid: challenges
 * first (they can pay bonus points), then milestones for every kid whose
 * earned total may have moved — the earners plus anyone a family challenge
 * just paid.
 */
export async function afterEarn(
  db: Database,
  familyId: string,
  kidIds: readonly string[],
  timezone: string,
): Promise<void> {
  const touched = new Set(kidIds);
  for (const kidId of kidIds) {
    const wins = await evaluateChallenges(db, familyId, kidId, timezone);
    for (const w of wins) touched.add(w.personId);
  }
  const unlocks: NewUnlock[] = [];
  for (const kidId of touched) {
    unlocks.push(...(await evaluateMilestones(db, familyId, kidId)));
  }
  await notifyUnlocks(db, familyId, unlocks);
}

/** Re-check milestones for one kid (e.g. after a held challenge bonus is paid). */
export async function afterBonus(
  db: Database,
  familyId: string,
  kidId: string,
): Promise<void> {
  await notifyUnlocks(
    db,
    familyId,
    await evaluateMilestones(db, familyId, kidId),
  );
}

/** Re-check the whole family (after a milestone is created, edited or resumed). */
export async function afterMilestoneChange(
  db: Database,
  familyId: string,
): Promise<void> {
  await notifyUnlocks(
    db,
    familyId,
    await evaluateMilestonesForFamily(db, familyId),
  );
}
