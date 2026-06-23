import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import {
  LogOut,
  Users,
  ListChecks,
  Gift,
  ChevronRight,
  Plus,
} from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { signOutAction } from "@/app/actions/auth";
import { getDb } from "@/lib/db/client";
import { getPersonById } from "@/lib/db/queries";
import { getKidBalances } from "@/lib/points/service";
import { IconByName } from "@/components/icons/registry";
import { families } from "@/lib/db/schema";
import styles from "./dashboard.module.css";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const db = getDb();
  const [family] = await db
    .select()
    .from(families)
    .where(eq(families.id, session.familyId))
    .limit(1);
  const me = await getPersonById(db, session.familyId, session.personId);
  if (!family || !me) redirect("/sign-in");

  const kids = await getKidBalances(db, session.familyId);

  return (
    <main id="main" className={styles.main}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Welcome back</p>
          <h1 className={styles.title}>{me.name}</h1>
        </div>
        <form action={signOutAction}>
          <button type="submit" className={styles.signOut}>
            <LogOut size={18} aria-hidden="true" />
            Sign out
          </button>
        </form>
      </header>

      <section aria-labelledby="kids-heading">
        <h2 id="kids-heading" className={styles.sectionTitle}>
          Your kids
        </h2>
        {kids.length > 0 ? (
          <ul className={styles.kidList}>
            {kids.map((k) => (
              <li key={k.id}>
                <Link href={`/award/${k.id}`} className={styles.kidCard}>
                  <span
                    className={styles.kidAvatar}
                    style={{ background: k.color }}
                  >
                    <IconByName name={k.avatar} size={24} />
                  </span>
                  <span className={styles.kidInfo}>
                    <span className={styles.kidCardName}>{k.name}</span>
                    <span
                      className={
                        k.balance < 0 ? styles.kidBalanceNeg : styles.kidBalance
                      }
                    >
                      {k.balance} pts
                    </span>
                  </span>
                  <span className={styles.awardChip}>
                    <Plus size={16} aria-hidden="true" />
                    Award
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.muted}>
            <Link href="/manage/kids">Add your kids</Link> to start awarding
            points.
          </p>
        )}
      </section>

      <section className={styles.card} aria-labelledby="family-heading">
        <h2 id="family-heading" className={styles.cardTitle}>
          {family.name}
        </h2>
        <p className={styles.muted}>
          Share this code so family members can join on a new device:
        </p>
        <p className={styles.code}>{family.code}</p>
      </section>

      <nav className={styles.manageNav} aria-label="Manage">
        <Link
          href="/manage/kids"
          className={styles.manageLink}
          aria-label="Kids"
        >
          <span className={styles.manageIcon}>
            <Users size={22} aria-hidden="true" />
          </span>
          <span className={styles.manageText}>
            <span className={styles.manageLabel}>Kids</span>
            <span className={styles.manageHint}>Profiles &amp; PINs</span>
          </span>
          <ChevronRight
            size={20}
            aria-hidden="true"
            className={styles.manageChevron}
          />
        </Link>
        <Link
          href="/manage/chores"
          className={styles.manageLink}
          aria-label="Chores"
        >
          <span className={styles.manageIcon}>
            <ListChecks size={22} aria-hidden="true" />
          </span>
          <span className={styles.manageText}>
            <span className={styles.manageLabel}>Chores</span>
            <span className={styles.manageHint}>Ways to earn points</span>
          </span>
          <ChevronRight
            size={20}
            aria-hidden="true"
            className={styles.manageChevron}
          />
        </Link>
        <Link
          href="/manage/rewards"
          className={styles.manageLink}
          aria-label="Rewards"
        >
          <span className={styles.manageIcon}>
            <Gift size={22} aria-hidden="true" />
          </span>
          <span className={styles.manageText}>
            <span className={styles.manageLabel}>Rewards</span>
            <span className={styles.manageHint}>Things to redeem</span>
          </span>
          <ChevronRight
            size={20}
            aria-hidden="true"
            className={styles.manageChevron}
          />
        </Link>
      </nav>

      <p className={styles.note}>
        More coming soon — start awarding points and let kids redeem rewards.
      </p>
    </main>
  );
}
