import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { getPersonById } from "@/lib/db/queries";
import { listChores } from "@/lib/catalog/service";
import { getBalance, listKidActivity } from "@/lib/points/service";
import { awardChoreAction } from "@/app/actions/points";
import { AwardExtras } from "@/components/points/AwardExtras";
import { ActivityList } from "@/components/points/ActivityList";
import { IconByName } from "@/components/icons/registry";
import manage from "@/components/manage/manage.module.css";
import styles from "@/components/points/points.module.css";

export const metadata: Metadata = { title: "Award points" };

export default async function AwardPage({
  params,
}: {
  params: Promise<{ kidId: string }>;
}) {
  const { kidId } = await params;
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (session.role !== "parent") redirect("/me");

  const db = getDb();
  const kid = await getPersonById(db, session.familyId, kidId);
  if (!kid || kid.role !== "kid") redirect("/dashboard");

  const [balance, allChores, activity] = await Promise.all([
    getBalance(db, session.familyId, kidId),
    listChores(db, session.familyId),
    listKidActivity(db, session.familyId, kidId, 15),
  ]);
  const activeChores = allChores.filter((c) => c.isActive);

  return (
    <main id="main" className={manage.main}>
      <Link href="/dashboard" className={manage.back}>
        <ArrowLeft size={18} aria-hidden="true" />
        Back to dashboard
      </Link>

      <div className={styles.awardHeader}>
        <span className={styles.avatar} style={{ background: kid.color }}>
          <IconByName name={kid.avatar} size={28} />
        </span>
        <span className={styles.who}>
          <span className={styles.kidName}>{kid.name}</span>
          <span className={balance < 0 ? styles.balanceNeg : styles.balance}>
            {balance} pts
          </span>
        </span>
      </div>

      <section aria-labelledby="chores-title">
        <h2 id="chores-title" className={styles.sectionTitle}>
          Award a chore
        </h2>
        {activeChores.length > 0 ? (
          <div className={styles.choreGrid}>
            {activeChores.map((c) => (
              <form key={c.id} action={awardChoreAction}>
                <input type="hidden" name="kidId" value={kidId} />
                <input type="hidden" name="choreId" value={c.id} />
                <button type="submit" className={styles.choreBtn}>
                  <span className={styles.choreIcon}>
                    <IconByName name={c.emoji} size={24} />
                  </span>
                  <span className={styles.choreName}>{c.name}</span>
                  <span className={styles.chorePoints}>+{c.points}</span>
                </button>
              </form>
            ))}
          </div>
        ) : (
          <p className={styles.empty}>
            No chores yet. <Link href="/manage/chores">Add some first</Link>.
          </p>
        )}
      </section>

      <AwardExtras kidId={kidId} />

      <section aria-labelledby="recent-title">
        <h2 id="recent-title" className={styles.sectionTitle}>
          Recent activity
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
    </main>
  );
}
