import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogOut, Gift } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { signOutAction } from "@/app/actions/auth";
import { getDb } from "@/lib/db/client";
import { getPersonById } from "@/lib/db/queries";
import { getBalance, listKidActivity } from "@/lib/points/service";
import { getAvailable } from "@/lib/redemptions/service";
import { IconByName } from "@/components/icons/registry";
import { ActivityList } from "@/components/points/ActivityList";
import { EnableNotifications } from "@/components/push/EnableNotifications";
import styles from "./me.module.css";

export const metadata: Metadata = { title: "My points" };

export default async function MePage() {
  const session = await getSession();
  if (!session) redirect("/enter");
  if (session.role !== "kid") redirect("/dashboard");

  const db = getDb();
  const me = await getPersonById(db, session.familyId, session.personId);
  if (!me) redirect("/enter");

  const [balance, available, activity] = await Promise.all([
    getBalance(db, session.familyId, session.personId),
    getAvailable(db, session.familyId, session.personId),
    listKidActivity(db, session.familyId, session.personId, 15),
  ]);

  return (
    <main id="main" className={styles.main}>
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
          {available !== balance
            ? `${available} available to spend`
            : balance === 0
              ? "Earn points for chores and good habits!"
              : "Keep up the great work!"}
        </p>
      </section>

      <Link href="/redeem" className={styles.redeemLink}>
        <Gift size={18} aria-hidden="true" />
        Redeem rewards
      </Link>

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

      <EnableNotifications />
    </main>
  );
}
