import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, ChevronRight, Trophy } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { getFamilyTimezone } from "@/lib/family/settings";
import { listChallenges } from "@/lib/challenges/service";
import { localDate } from "@/lib/timezone";
import {
  goalSummary,
  scopeLabel,
  dateRange,
  challengeStatus,
  type ChallengeStatus,
} from "@/lib/challenges/format";
import manage from "@/components/manage/manage.module.css";
import styles from "@/components/challenges/challenges.module.css";

export const metadata: Metadata = { title: "Challenges" };

const STATUS_LABEL: Record<ChallengeStatus, string> = {
  active: "Active",
  upcoming: "Upcoming",
  ended: "Ended",
  paused: "Paused",
};

export default async function ChallengesPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (session.role !== "parent") redirect("/me");

  const db = getDb();
  const [list, tz] = await Promise.all([
    listChallenges(db, session.familyId),
    getFamilyTimezone(db, session.familyId),
  ]);
  const today = localDate(tz, new Date());
  const sorted = [...list].reverse(); // newest first

  return (
    <main id="main" className={manage.main}>
      <Link href="/dashboard" className={manage.back}>
        <ArrowLeft size={18} aria-hidden="true" />
        Back to dashboard
      </Link>
      <h1 className={manage.title}>Challenges</h1>
      <p className={styles.intro}>
        Time-boxed goals that pay a bonus when a kid (or the whole family) hits
        them.
      </p>

      <Link href="/manage/challenges/new" className={manage.addBtn}>
        <Plus size={18} aria-hidden="true" />
        Add a challenge
      </Link>

      {sorted.length === 0 ? (
        <p className={styles.empty}>
          No challenges yet — add one to kick off a points race or a family
          goal.
        </p>
      ) : (
        <ul className={styles.list}>
          {sorted.map((c) => {
            const status = challengeStatus(c, today);
            return (
              <li key={c.id}>
                <Link
                  href={`/manage/challenges/${c.id}`}
                  className={styles.row}
                >
                  <span className={styles.icon} aria-hidden="true">
                    <Trophy size={20} />
                  </span>
                  <span className={styles.main}>
                    <span className={styles.name}>{c.title}</span>
                    <span className={styles.meta}>
                      {goalSummary(c.goalType, c.goalTarget)} ·{" "}
                      {scopeLabel(c.scope)} · {dateRange(c.startsOn, c.endsOn)}
                      {c.recurrence === "weekly" ? " · Weekly" : ""}
                    </span>
                  </span>
                  <span className={styles.end}>
                    <span className={styles.bonus}>+{c.bonusPoints}</span>
                    <span className={styles.status} data-status={status}>
                      {STATUS_LABEL[status]}
                    </span>
                  </span>
                  <ChevronRight
                    size={18}
                    aria-hidden="true"
                    className={styles.chevron}
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
