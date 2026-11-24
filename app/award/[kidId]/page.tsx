import type { Metadata } from "next";
import { redirect } from "next/navigation";
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
import { listCashInRewards } from "@/lib/redemptions/service";
import { AwardSurface } from "@/components/points/AwardSurface";
import { ActivityList } from "@/components/points/ActivityList";
import { IconByName } from "@/components/icons/registry";
import { AwardNav } from "@/components/manage/AwardNav";
import manage from "@/components/manage/manage.module.css";
import styles from "@/components/points/points.module.css";

export const metadata: Metadata = { title: "Award points" };

export default async function AwardPage({
  params,
  searchParams,
}: {
  params: Promise<{ kidId: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { kidId } = await params;
  const { mode } = await searchParams;
  const initialMode = mode === "deduct" ? "deduct" : "award";
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (session.role !== "parent") redirect("/me");

  const db = getDb();
  const kid = await getPersonById(db, session.familyId, kidId);
  if (!kid || kid.role !== "kid") redirect("/dashboard");

  const [
    balance,
    allChores,
    activity,
    mostUsedIds,
    kidBalances,
    categories,
    cashIn,
  ] = await Promise.all([
    getBalance(db, session.familyId, kidId),
    listChores(db, session.familyId),
    listKidActivity(db, session.familyId, kidId, 15),
    mostUsedChoreIds(db, session.familyId, kidId, 6),
    getKidBalances(db, session.familyId),
    listCategories(db, session.familyId),
    listCashInRewards(db, session.familyId, kidId),
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
      limitScope: c.limitScope,
      isCore: c.isCore,
    }));
  // What each other kid could cash in, so "Also give to" picks can share a
  // reward (#189 follow-up). Small per family; the server re-checks anyway.
  const otherCashIn = await Promise.all(
    kidBalances
      .filter((k) => k.id !== kidId)
      .map(async (k) => ({
        kidId: k.id,
        ...(await listCashInRewards(db, session.familyId, k.id)),
      })),
  );
  const cashInByKid = Object.fromEntries(
    [{ kidId, ...cashIn }, ...otherCashIn].map((c) => [
      c.kidId,
      { available: c.available, rewards: c.rewards },
    ]),
  );
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

      <AwardSurface
        kidId={kidId}
        kidName={kid.name}
        chores={activeChores}
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          icon: c.icon,
        }))}
        mostUsedIds={mostUsedIds}
        otherKids={otherKids}
        initialMode={initialMode}
        rewards={cashIn.rewards}
        cashInByKid={cashInByKid}
      />

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
            type: e.type,
            reversed: e.reversed,
            refundable: e.type === "redeem" && e.redemptionId !== null,
          }))}
          undoKidName={kid.name}
        />
      </section>

      <AwardNav />
    </main>
  );
}
