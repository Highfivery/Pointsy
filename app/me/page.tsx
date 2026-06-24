import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogOut, Gift, ClipboardCheck, X } from "lucide-react";
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
} from "@/lib/submissions/service";
import { cancelSubmissionAction } from "@/app/actions/submissions";
import { IconByName } from "@/components/icons/registry";
import { ActivityList } from "@/components/points/ActivityList";
import { Celebration } from "@/components/me/Celebration";
import { RewardShelf } from "@/components/me/RewardShelf";
import { KidGoal } from "@/components/me/KidGoal";
import { EnableNotifications } from "@/components/push/EnableNotifications";
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
    streak,
    redeemable,
    goal,
  ] = await Promise.all([
    getBalance(db, session.familyId, session.personId),
    getPendingPoints(db, session.familyId, session.personId),
    listKidSubmissions(db, session.familyId, session.personId, 20),
    listKidActivity(db, session.familyId, session.personId, 15),
    getStreak(db, session.familyId, session.personId, tz),
    listRedeemableRewards(db, session.familyId, session.personId),
    getKidGoal(db, session.familyId, session.personId),
  ]);
  const waiting = submissions.filter((s) => s.status === "pending");
  const available = redeemable.available;

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
          {balance}
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
        {streak > 0 ? (
          <p className={hype.streak}>🔥 {streak}-day streak — keep it going!</p>
        ) : null}
      </section>

      <KidGoal goal={goal} rewardOptions={rewardOptions} />

      <RewardShelf
        available={available}
        affordable={affordable}
        nextUp={nextUp}
      />

      <div className={styles.actions}>
        <Link href="/submit" className={styles.actionLink}>
          <ClipboardCheck size={18} aria-hidden="true" />
          Log a chore
        </Link>
        <Link href="/redeem" className={styles.actionLink}>
          <Gift size={18} aria-hidden="true" />
          Redeem rewards
        </Link>
      </div>

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
    </main>
  );
}
