import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { getKidBalances } from "@/lib/points/service";
import {
  activeParticipantIds,
  getLifetimeEarnedByKid,
  getMilestone,
  isMilestoneLocked,
} from "@/lib/milestones/service";
import { MilestoneEditor } from "@/components/milestones/MilestoneEditor";
import { MilestoneDangerZone } from "@/components/milestones/MilestoneDangerZone";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { ManageNav } from "@/components/manage/ManageNav";
import manage from "@/components/manage/manage.module.css";

export const metadata: Metadata = { title: "Edit milestone" };

export default async function EditMilestonePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (session.role !== "parent") redirect("/me");

  const db = getDb();
  const milestone = await getMilestone(db, session.familyId, id);
  if (!milestone) redirect("/manage/milestones");

  const [kids, lifetime, kidIds, locked] = await Promise.all([
    getKidBalances(db, session.familyId),
    getLifetimeEarnedByKid(db, session.familyId),
    activeParticipantIds(db, session.familyId, milestone.id),
    isMilestoneLocked(db, session.familyId, milestone.id),
  ]);

  return (
    <main id="main" className={manage.main}>
      <ScreenHeader title="Edit milestone" />
      <MilestoneEditor
        kids={kids.map((k) => ({
          id: k.id,
          name: k.name,
          avatar: k.avatar,
          color: k.color,
          lifetime: lifetime.get(k.id) ?? 0,
        }))}
        locked={locked}
        defaults={{
          id: milestone.id,
          title: milestone.title,
          reward: milestone.reward,
          target: milestone.target,
          repeats: milestone.repeats,
          startMode: milestone.startMode,
          allKids: milestone.allKids,
          kidIds,
        }}
      />
      <MilestoneDangerZone
        id={milestone.id}
        title={milestone.title}
        isActive={milestone.isActive}
      />
      <ManageNav section="milestones" />
    </main>
  );
}
