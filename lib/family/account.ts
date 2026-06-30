import { eq, inArray } from "drizzle-orm";
import type { Database } from "@/lib/db/types";
import {
  families,
  people,
  choreCategories,
  chores,
  choreAssignees,
  choreSubtasks,
  rewards,
  ledger,
  redemptions,
  teamRedemptions,
  teamRedemptionMembers,
  choreSubmissions,
  challenges,
  challengeParticipants,
  challengeAwards,
} from "@/lib/db/schema";

/**
 * Permanently delete a family and everything in it. Every domain table carries
 * a `familyId` FK with `onDelete: "cascade"`, so a single delete on the family
 * row removes all people, catalog, ledger, and activity. This is the GDPR/COPPA
 * erasure path — the only sanctioned exception to the append-only ledger rule.
 */
export async function deleteFamily(
  db: Database,
  familyId: string,
): Promise<void> {
  await db.delete(families).where(eq(families.id, familyId));
}

/**
 * A full export of a family's data as plain JSON for a parent. Excludes all
 * secrets — password and PIN hashes and lockout counters are never included.
 */
export async function exportFamilyData(db: Database, familyId: string) {
  const [family] = await db
    .select()
    .from(families)
    .where(eq(families.id, familyId))
    .limit(1);

  // People without any credential fields.
  const peopleRows = await db
    .select({
      id: people.id,
      role: people.role,
      name: people.name,
      avatar: people.avatar,
      color: people.color,
      email: people.email,
      goalRewardId: people.goalRewardId,
      consentAt: people.consentAt,
      consentVersion: people.consentVersion,
      createdAt: people.createdAt,
    })
    .from(people)
    .where(eq(people.familyId, familyId));

  const categories = await db
    .select()
    .from(choreCategories)
    .where(eq(choreCategories.familyId, familyId));
  const choreRows = await db
    .select()
    .from(chores)
    .where(eq(chores.familyId, familyId));
  const choreIds = choreRows.map((c) => c.id);
  const assignees = choreIds.length
    ? await db
        .select()
        .from(choreAssignees)
        .where(inArray(choreAssignees.choreId, choreIds))
    : [];
  const subtasks = choreIds.length
    ? await db
        .select()
        .from(choreSubtasks)
        .where(inArray(choreSubtasks.choreId, choreIds))
    : [];
  const rewardRows = await db
    .select()
    .from(rewards)
    .where(eq(rewards.familyId, familyId));
  const ledgerRows = await db
    .select()
    .from(ledger)
    .where(eq(ledger.familyId, familyId));
  const redemptionRows = await db
    .select()
    .from(redemptions)
    .where(eq(redemptions.familyId, familyId));
  const teamRows = await db
    .select()
    .from(teamRedemptions)
    .where(eq(teamRedemptions.familyId, familyId));
  const teamIds = teamRows.map((t) => t.id);
  const teamMembers = teamIds.length
    ? await db
        .select()
        .from(teamRedemptionMembers)
        .where(inArray(teamRedemptionMembers.teamRedemptionId, teamIds))
    : [];
  const submissions = await db
    .select()
    .from(choreSubmissions)
    .where(eq(choreSubmissions.familyId, familyId));
  const challengeRows = await db
    .select()
    .from(challenges)
    .where(eq(challenges.familyId, familyId));
  const challengeIds = challengeRows.map((c) => c.id);
  const participants = challengeIds.length
    ? await db
        .select()
        .from(challengeParticipants)
        .where(inArray(challengeParticipants.challengeId, challengeIds))
    : [];
  const awards = challengeIds.length
    ? await db
        .select()
        .from(challengeAwards)
        .where(inArray(challengeAwards.challengeId, challengeIds))
    : [];

  return {
    schema: "pointsy.family-export.v1",
    exportedAt: new Date().toISOString(),
    family: family ?? null,
    people: peopleRows,
    categories,
    chores: choreRows,
    choreAssignees: assignees,
    choreSubtasks: subtasks,
    rewards: rewardRows,
    ledger: ledgerRows,
    redemptions: redemptionRows,
    teamRedemptions: teamRows,
    teamRedemptionMembers: teamMembers,
    choreSubmissions: submissions,
    challenges: challengeRows,
    challengeParticipants: participants,
    challengeAwards: awards,
  };
}
