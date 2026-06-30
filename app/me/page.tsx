import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogOut, ArrowRight, X, Hourglass } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { signOutAction } from "@/app/actions/auth";
import { getDb } from "@/lib/db/client";
import { getPersonById } from "@/lib/db/queries";
import { getBalance, listKidActivity, getStreak } from "@/lib/points/service";
import {
  listRedeemableRewards,
  getKidGoal,
  listKidAssignedRewards,
} from "@/lib/redemptions/service";
import { getFamilyTimezone } from "@/lib/family/settings";
import { localDate, weekdayOf } from "@/lib/timezone";
import { dayAllowed } from "@/lib/chores/window";
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
import { KidRewardGoals } from "@/components/me/KidRewardGoals";
import { SubmitMustDo } from "@/components/me/SubmitMustDo";
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
    assignedRewards,
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
    listKidAssignedRewards(db, session.familyId, session.personId),
    listSubmittableChores(db, session.familyId, session.personId, tz),
    listKidChallenges(db, session.familyId, session.personId, tz),
  ]);
  const waiting = submissions.filter((s) => s.status === "pending");
  const available = redeemable.available;

  // Today's must-dos: core chores this kid is responsible for. A chore whose
  // logging window excludes today's weekday isn't due today at all; one that's
  // merely time-locked (opens later today) still counts — it shows a countdown.
  const todayWeekday = weekdayOf(localDate(tz, new Date()));
  const coreChores = submittable.filter((c) => c.isCore && c.eligible);
  const coreDueToday = coreChores.filter((c) =>
    dayAllowed(c.logWindowDays, todayWeekday),
  );
  const coreTotal = coreDueToday.length;
  const coreDone = coreDueToday.filter((c) => c.loggedToday).length;
  // Available must-dos first, then a "Coming up later" group for the ones still
  // time-locked (showing a countdown), so a kid sees what they can do now (#123).
  const coreTodo = coreDueToday.filter((c) => !c.loggedToday);
  const todoNow = coreTodo.filter((c) => c.windowState !== "locked");
  const todoLater = coreTodo.filter((c) => c.windowState === "locked");
  const coreStreakDays =
    coreTotal > 0
      ? await getCoreStreak(
          db,
          session.familyId,
          session.personId,
          tz,
          coreChores.map((c) => ({ id: c.id, days: c.logWindowDays })),
        )
      : 0;

  // Personal "just for you" rewards get their own hero card below, so keep them
  // out of the generic shelf/goal lists to avoid showing the same reward twice.
  const assignedIds = new Set(assignedRewards.map((g) => g.reward.id));
  const generalRewards = redeemable.rewards.filter(
    (r) => !assignedIds.has(r.id),
  );
  const affordable = generalRewards
    .filter((r) => r.affordable)
    .map((r) => ({
      id: r.id,
      name: r.name,
      emoji: r.emoji,
      cost: r.cost,
      moreNeeded: r.moreNeeded,
    }));
  const nextReward = generalRewards
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
  const rewardOptions = generalRewards.map((r) => ({
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

      <KidRewardGoals rewards={assignedRewards} />

      {coreTotal > 0 ? (
        <section className={styles.today} aria-labelledby="core-heading">
          <CoreProgress
            done={coreDone}
            total={coreTotal}
            streak={coreStreakDays}
          />
          {coreTodo.length > 0 ? (
            <>
              {todoNow.length > 0 ? (
                <ul className={styles.todoList}>
                  {todoNow.map((c) => (
                    <SubmitMustDo
                      key={c.id}
                      timezone={tz}
                      chore={{
                        id: c.id,
                        name: c.name,
                        emoji: c.emoji,
                        points: c.points,
                        windowState: c.windowState,
                        opensAt: c.opensAt,
                      }}
                    />
                  ))}
                </ul>
              ) : null}
              {todoLater.length > 0 ? (
                <div className={styles.todoLaterGroup}>
                  <p className={styles.todoLater}>
                    <Hourglass size={14} aria-hidden="true" />
                    Coming up later
                  </p>
                  <ul className={styles.todoList}>
                    {todoLater.map((c) => (
                      <SubmitMustDo
                        key={c.id}
                        timezone={tz}
                        chore={{
                          id: c.id,
                          name: c.name,
                          emoji: c.emoji,
                          points: c.points,
                          windowState: c.windowState,
                          opensAt: c.opensAt,
                        }}
                      />
                    ))}
                  </ul>
                </div>
              ) : null}
              <Link href="/submit" className={styles.todoCta}>
                See all chores
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
