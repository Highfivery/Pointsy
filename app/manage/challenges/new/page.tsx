import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { getKidBalances } from "@/lib/points/service";
import { getFamilyTimezone } from "@/lib/family/settings";
import { localDate, addDays } from "@/lib/timezone";
import { ChallengeEditor } from "@/components/challenges/ChallengeEditor";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { ManageNav } from "@/components/manage/ManageNav";
import manage from "@/components/manage/manage.module.css";

export const metadata: Metadata = { title: "Add a challenge" };

export default async function NewChallengePage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (session.role !== "parent") redirect("/me");

  const db = getDb();
  const [kids, tz] = await Promise.all([
    getKidBalances(db, session.familyId),
    getFamilyTimezone(db, session.familyId),
  ]);
  const today = localDate(tz, new Date());

  return (
    <main id="main" className={manage.main}>
      <ScreenHeader
        title="Add a challenge"
        intro="A time-boxed goal that pays a bonus when it’s hit."
      />
      <ChallengeEditor
        kids={kids.map((k) => ({
          id: k.id,
          name: k.name,
          avatar: k.avatar,
          color: k.color,
        }))}
        defaults={{ startsOn: today, endsOn: addDays(today, 7) }}
      />
      <ManageNav section="challenges" />
    </main>
  );
}
