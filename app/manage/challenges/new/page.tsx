import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { getKidBalances } from "@/lib/points/service";
import { getFamilyTimezone } from "@/lib/family/settings";
import { localDate, addDays } from "@/lib/timezone";
import { ChallengeEditor } from "@/components/challenges/ChallengeEditor";
import manage from "@/components/manage/manage.module.css";

export const metadata: Metadata = { title: "New challenge" };

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
      <Link href="/manage/challenges" className={manage.back}>
        <ArrowLeft size={18} aria-hidden="true" />
        Back to challenges
      </Link>
      <h1 className={manage.title}>New challenge</h1>
      <ChallengeEditor
        kids={kids.map((k) => ({
          id: k.id,
          name: k.name,
          avatar: k.avatar,
          color: k.color,
        }))}
        defaults={{ startsOn: today, endsOn: addDays(today, 7) }}
      />
    </main>
  );
}
