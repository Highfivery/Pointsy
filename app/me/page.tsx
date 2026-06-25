import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogOut, ArrowRight, X } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { signOutAction } from "@/app/actions/auth";
import { getDb } from "@/lib/db/client";
import { getPersonById } from "@/lib/db/queries";
import { getBalance, listKidActivity, getStreak } from "@/lib/points/service";
import { listRedeemableRewards, getKidGoal } from "@/lib/redemptions/service";
import { getFamilyTimezone } from "@/lib/family/settings";
import {
  getPendingPoints,
  listKidSubmissions,
  listSubmittableChores,
  getCoreStreak,
} from "@/lib/submissions/service";
import { listKidChallenges } from "@/lib/challenges/service";
import { cancelSubmissionAction } from "@/app/actions/submissions";
import { IconByName } from "@/components/icons/registry";
import { ActivityList } from "@/components/points/ActivityList";
import { Celebration } from "@/components/me/Celebration";
import { CoreProgress } from "@/components/me/CoreProgress";
import { KidChallenges } from "@/components/me/KidChallenges";
import { RewardShelf } from "@/components/me/RewardShelf";
import { KidGoal } from "@/components/me/KidGoal";
import { EnableNotifications } from "@/components/push/EnableNotifications";
import { KidTabBar } from "@/components/kid/KidTabBar";
import { CountUp } from "@/components/me/CountUp";
import styles from "./me.module.css";
import hype from "@/components/me/hype.module.css";

export const metadata: Metadata = { title: "My points" };

export default async function MePage() {
  const session = await getSession();
  if (!session) redirect("/enter");
  if (session.role !== "kid") redirect("/dashboard");

  const db = getDb();
  const me = await getPersonById(db, session.familyId, session.personId);
  if (!me) redirect("/enter");

  const tz = await getFamilyTimezone(db, session.familyId);
  const [
    balance,
    pendingPoints,
    submissions,
    activity,
    earnStreak,
    redeemable,
    goal,
    submittable,
    challenges,
  ] = await Promise.all([
    getBalance(db, session.familyId, session.personId),
    getPendingPoints(db, session.familyId, session.personId),
    listKidSubmissions(db, session.familyId, session.personId, 20),
    listKidActivity(db, session.familyId, session.personId, 15),
    getStreak(db, session.familyId, session.personId, tz),
    listRedeemableRewards(db, session.familyId, session.personId),
    getKidGoal(db, session.familyId, session.personId),
    listSubmittableChores(db, session.familyId, session.personId, tz),
    listKidChallenges(db, session.familyId, session.personId, tz),
  ]);
  const waiting = submissions.filter((s) => s.status === "pending");
  const available = redeemable.available;

  // Today's must-dos: core chores this kid is responsible for.
  const coreChores = submittable.filter((c) => c.isCore && c.eligible);
  const coreTotal = coreChores.length;
  const coreDone = coreChores.filter((c) => c.loggedToday).length;
  const coreTodo = coreChores.filter((c) => !c.loggedToday);
  const coreStreakDays =
    coreTotal > 0
      ? await getCoreStreak(
          db,
          session.familyId,
          session.personId,
          tz,
          coreChores.map((c) => c.id),
        )
      : 0;

  const affordable = redeemable.rewards
    .filter((r) => r.affordable)
    .map((r) => ({
      id: r.id,
      name: r.name,
      emoji: r.emoji,
      cost: r.cost,
      moreNeeded: r.moreNeeded,
    }));
  const nextReward = redeemable.rewards
    .filter((r) => !r.affordable)
    .sort((a, b) => a.moreNeeded - b.moreNeeded)[0];
  const nextUp = nextReward
    ? {
        id: nextReward.id,
        name: nextReward.name,
        emoji: nextReward.emoji,
        cost: nextReward.cost,
        moreNeeded: nextReward.moreNeeded,
      }
    : null;
  const rewardOptions = redeemable.rewards.map((r) => ({
    id: r.id,
    name: r.name,
    cost: r.cost,
  }));

  return (
    <main id="main" className={styles.main}>
      <Celebration kidId={session.personId} balance={balance} />
      <header className={styles.header}>
        <span className={styles.avatar} style={{ background: me.color }}>
          <IconByName name={me.avatar} size={28} />
        </span>
        <form action={signOutAction}>
          <button type="submit" className={styles.signOut}>
            <LogOut size={18} aria-hidden="true" />
            Sign out
          </button>
        </form>
      </header>

      <h1 className={styles.title}>Hi {me.name}! 👋</h1>

      <section className={styles.card} aria-labelledby="points-heading">
        <h2 id="points-heading" className={styles.pointsLabel}>
          Your points
        </h2>
        <p className={balance < 0 ? styles.pointsNeg : styles.points}>
          <CountUp value={balance} />
        </p>
        <p className={styles.muted}>
          {balance < 0
            ? `Earn ${-balance} to get back to zero!`
            : available !== balance
              ? `${available} available to spend`
              : balance === 0
                ? "Earn points for chores and good habits!"
                : "Keep up the great work!"}
        </p>
        {pendingPoints > 0 ? (
          <p className={styles.pending}>
            +{pendingPoints} waiting for approval
          </p>
        ) : null}
        {coreTotal === 0 && earnStreak > 0 ? (
          <p className={hype.streak}>
            🔥 {earnStreak}-day streak — keep it going!
          </p>
        ) : null}
      </section>

      {coreTotal > 0 ? (
        <section className={styles.today} aria-labelledby="core-heading">
          <CoreProgress
            done={coreDone}
            total={coreTotal}
            streak={coreStreakDays}
          />
          {coreTodo.length > 0 ? (
            <>
              <ul className={styles.todoList}>
                {coreTodo.map((c) => (
                  <li key={c.id} className={styles.todoRow}>
                    <span className={styles.todoIcon} aria-hidden="true">
                      <IconByName name={c.emoji} size={20} />
                    </span>
                    <span className={styles.todoName}>{c.name}</span>
                    <span className={styles.todoPts}>+{c.points}</span>
                  </li>
                ))}
              </ul>
              <Link href="/submit" className={styles.todoCta}>
                Go do chores
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </>
          ) : null}
        </section>
      ) : null}

      <KidChallenges items={challenges} />

      <KidGoal goal={goal} rewardOptions={rewardOptions} />

      <RewardShelf
        available={available}
        affordable={affordable}
        nextUp={nextUp}
      />

      {waiting.length > 0 ? (
        <section aria-labelledby="waiting-heading">
          <h2 id="waiting-heading" className={styles.activityTitle}>
            Waiting for approval
          </h2>
          <ul className={styles.waitList}>
            {waiting.map((s) => (
              <li key={s.id} className={styles.waitRow}>
                <span className={styles.waitText}>{s.choreName}</span>
                <span className={styles.waitPts}>+{s.points}</span>
                <form action={cancelSubmissionAction}>
                  <input type="hidden" name="submissionId" value={s.id} />
                  <button
                    type="submit"
                    className={styles.cancelBtn}
                    aria-label={`Cancel ${s.choreName}`}
                  >
                    <X size={16} aria-hidden="true" />
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="activity-heading">
        <h2 id="activity-heading" className={styles.activityTitle}>
          Recent
        </h2>
        <ActivityList
          entries={activity.map((e) => ({
            id: e.id,
            amount: e.amount,
            reason: e.reason,
            createdAt: e.createdAt,
          }))}
        />
      </section>

      <EnableNotifications audience="kid" />
      <KidTabBar />
    </main>
  );
}
