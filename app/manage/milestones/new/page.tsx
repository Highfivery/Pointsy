import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { getKidBalances } from "@/lib/points/service";
import { getLifetimeEarnedByKid } from "@/lib/milestones/service";
import { MilestoneEditor } from "@/components/milestones/MilestoneEditor";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { ManageNav } from "@/components/manage/ManageNav";
import manage from "@/components/manage/manage.module.css";

export const metadata: Metadata = { title: "Add a milestone" };

export default async function NewMilestonePage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (session.role !== "parent") redirect("/me");

  const db = getDb();
  const [kids, lifetime] = await Promise.all([
    getKidBalances(db, session.familyId),
    getLifetimeEarnedByKid(db, session.familyId),
  ]);

  return (
    <main id="main" className={manage.main}>
      <ScreenHeader
        title="Add a milestone"
        intro="A real-world reward kids unlock by earning points over time."
      />
      <MilestoneEditor
        kids={kids.map((k) => ({
          id: k.id,
          name: k.name,
          avatar: k.avatar,
          color: k.color,
          lifetime: lifetime.get(k.id) ?? 0,
        }))}
      />
      <ManageNav section="milestones" />
    </main>
  );
}
