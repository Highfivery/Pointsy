import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { getPersonById } from "@/lib/db/queries";
import { listChores } from "@/lib/catalog/service";
import { listCategories } from "@/lib/categories/service";
import {
  getBalance,
  listKidActivity,
  mostUsedChoreIds,
  getKidBalances,
} from "@/lib/points/service";
import { AwardBoard } from "@/components/points/AwardBoard";
import { AwardExtras } from "@/components/points/AwardExtras";
import { ActivityList } from "@/components/points/ActivityList";
import { IconByName } from "@/components/icons/registry";
import { AwardNav } from "@/components/manage/AwardNav";
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

  const [balance, allChores, activity, mostUsedIds, kidBalances, categories] =
    await Promise.all([
      getBalance(db, session.familyId, kidId),
      listChores(db, session.familyId),
      listKidActivity(db, session.familyId, kidId, 15),
      mostUsedChoreIds(db, session.familyId, kidId, 6),
      getKidBalances(db, session.familyId),
      listCategories(db, session.familyId),
    ]);
  const activeChores = allChores
    .filter((c) => c.isActive)
    .map((c) => ({
      id: c.id,
      name: c.name,
      emoji: c.emoji,
      points: c.points,
      categoryId: c.categoryId,
      pinned: c.pinned,
      limitPeriod: c.limitPeriod,
      limitCount: c.limitCount,
    }));
  const otherKids = kidBalances
    .filter((k) => k.id !== kidId)
    .map((k) => ({
      id: k.id,
      name: k.name,
      avatar: k.avatar,
      color: k.color,
    }));

  return (
    <main id="main" className={manage.main}>
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
          <AwardBoard
            kidId={kidId}
            chores={activeChores}
            categories={categories.map((c) => ({
              id: c.id,
              name: c.name,
              icon: c.icon,
            }))}
            mostUsedIds={mostUsedIds}
            otherKids={otherKids}
          />
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

      <AwardNav />
    </main>
  );
}
