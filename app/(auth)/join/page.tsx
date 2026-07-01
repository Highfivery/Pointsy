import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { JoinForm } from "@/components/parents/JoinForm";
import styles from "../auth.module.css";

export const metadata: Metadata = {
  title: "Join a family",
  description:
    "Have an invite code from another parent? Join their family on Pointsy and share the dashboard.",
  alternates: { canonical: "/join" },
};

export default async function JoinPage() {
  // Already signed in? You're already in a family.
  const session = await getSession();
  if (session) redirect(session.role === "kid" ? "/me" : "/dashboard");

  return (
    <main id="main" className={styles.main}>
      <section className={styles.card} aria-labelledby="join-title">
        <div className={styles.intro}>
          <h1 id="join-title" className={styles.title}>
            Join a family
          </h1>
          <p className={styles.subtitle}>
            Enter the invite code another parent shared with you to get access
            to their Pointsy dashboard.
          </p>
        </div>
        <JoinForm />
        <p className={styles.alt}>
          Already have an account? <Link href="/sign-in">Sign in</Link>
        </p>
      </section>
    </main>
  );
}
