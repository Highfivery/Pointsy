import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { getFamilyTimezone } from "@/lib/family/settings";
import { listSubmittableChores } from "@/lib/submissions/service";
import { submitChoreAction } from "@/app/actions/submissions";
import { IconByName } from "@/components/icons/registry";
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
        <ul className={styles.list}>
          {chores.map((c) => (
            <li key={c.id}>
              <form action={submitChoreAction}>
                <input type="hidden" name="choreId" value={c.id} />
                <button
                  type="submit"
                  className={styles.chore}
                  disabled={!c.canSubmit}
                >
                  <span
                    className={styles.choreIcon}
                    aria-hidden="true"
                    data-done={!c.canSubmit}
                  >
                    <IconByName name={c.emoji} size={24} />
                  </span>
                  <span className={styles.choreText}>
                    <span className={styles.choreName}>{c.name}</span>
                    {c.description ? (
                      <span className={styles.choreDesc}>{c.description}</span>
                    ) : null}
                    {!c.canSubmit ? (
                      <span className={styles.doneTag}>{c.reason}</span>
                    ) : null}
                  </span>
                  <span className={styles.chorePts}>
                    {c.canSubmit ? <Plus size={14} aria-hidden="true" /> : null}
                    {c.points}
                  </span>
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
