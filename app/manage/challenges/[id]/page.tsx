import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { getKidBalances } from "@/lib/points/service";
import { getChallenge } from "@/lib/challenges/service";
import { challengeParticipants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ChallengeEditor } from "@/components/challenges/ChallengeEditor";
import { ChallengeDangerZone } from "@/components/challenges/ChallengeDangerZone";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { ManageNav } from "@/components/manage/ManageNav";
import manage from "@/components/manage/manage.module.css";

export const metadata: Metadata = { title: "Edit challenge" };

export default async function EditChallengePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (session.role !== "parent") redirect("/me");

  const db = getDb();
  const challenge = await getChallenge(db, session.familyId, id);
  if (!challenge) redirect("/manage/challenges");

  // Explicit participants only (don't pre-tick "everyone" as specific kids).
  const [explicit, kids] = await Promise.all([
    db
      .select({ personId: challengeParticipants.personId })
      .from(challengeParticipants)
      .where(eq(challengeParticipants.challengeId, challenge.id)),
    getKidBalances(db, session.familyId),
  ]);

  return (
    <main id="main" className={manage.main}>
      <ScreenHeader title="Edit challenge" />
      <ChallengeEditor
        kids={kids.map((k) => ({
          id: k.id,
          name: k.name,
          avatar: k.avatar,
          color: k.color,
        }))}
        defaults={{
          id: challenge.id,
          title: challenge.title,
          description: challenge.description,
          scope: challenge.scope,
          recurrence: challenge.recurrence,
          goalType: challenge.goalType,
          goalTarget: challenge.goalTarget,
          bonusPoints: challenge.bonusPoints,
          autoAward: challenge.autoAward,
          startsOn: challenge.startsOn,
          endsOn: challenge.endsOn,
          kidIds: explicit.map((p) => p.personId),
        }}
      />
      <ChallengeDangerZone
        id={challenge.id}
        title={challenge.title}
        isActive={challenge.isActive}
      />
      <ManageNav section="challenges" />
    </main>
  );
}
