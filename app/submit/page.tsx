import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { getFamilyTimezone } from "@/lib/family/settings";
import { listSubmittableChores } from "@/lib/submissions/service";
import { groupByCategory } from "@/lib/catalog/category";
import { IconByName } from "@/components/icons/registry";
import { SubmitChoreCard } from "@/components/submit/SubmitChoreCard";
import styles from "./submit.module.css";

export const metadata: Metadata = { title: "Log a chore" };

export default async function SubmitPage() {
  const session = await getSession();
  if (!session) redirect("/enter");
  if (session.role !== "kid") redirect("/dashboard");

  const db = getDb();
  const tz = await getFamilyTimezone(db, session.familyId);
  const chores = await listSubmittableChores(
    db,
    session.familyId,
    session.personId,
    tz,
  );

  return (
    <main id="main" className={styles.main}>
      <Link href="/me" className={styles.back}>
        <ArrowLeft size={18} aria-hidden="true" />
        Back
      </Link>
      <h1 className={styles.title}>Log a chore you did</h1>
      <p className={styles.intro}>
        Tap a chore you finished — a grown-up approves it to add the points.
      </p>

      {chores.length === 0 ? (
        <p className={styles.empty}>
          No chores yet — ask a parent to add some.
        </p>
      ) : (
        groupByCategory(chores).map(({ meta, items }) => (
          <section
            key={meta.key}
            className={styles.section}
            aria-label={meta.label}
          >
            <h2 className={styles.sectionTitle}>
              <IconByName name={meta.icon} size={18} />
              {meta.label}
            </h2>
            <ul className={styles.list}>
              {items.map((c) => (
                <SubmitChoreCard key={c.id} chore={c} />
              ))}
            </ul>
          </section>
        ))
      )}
    </main>
  );
}
