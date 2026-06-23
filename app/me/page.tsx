import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { signOutAction } from "@/app/actions/auth";
import { getDb } from "@/lib/db/client";
import { getPersonById } from "@/lib/db/queries";
import { IconByName } from "@/components/icons/registry";
import styles from "./me.module.css";

export const metadata: Metadata = { title: "My points" };

export default async function MePage() {
  const session = await getSession();
  if (!session) redirect("/enter");
  if (session.role !== "kid") redirect("/dashboard");

  const me = await getPersonById(getDb(), session.familyId, session.personId);
  if (!me) redirect("/enter");

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
        <p className={styles.points}>0</p>
        <p className={styles.muted}>
          Earn points for chores and good habits — coming soon!
        </p>
      </section>
    </main>
  );
}
