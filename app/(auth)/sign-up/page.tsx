import type { Metadata } from "next";
import Link from "next/link";
import { SignUpForm } from "@/components/auth/SignUpForm";
import styles from "../auth.module.css";

export const metadata: Metadata = {
  title: "Create your family",
  description:
    "Set up Pointsy for your household in under a minute — it's free, with no ads. Reward chores and good habits with points kids can redeem.",
  alternates: { canonical: "/sign-up" },
};

export default function SignUpPage() {
  return (
    <main id="main" className={styles.main}>
      <section className={styles.card} aria-labelledby="signup-title">
        <h1 id="signup-title" className={styles.title}>
          Create your family
        </h1>
        <p className={styles.subtitle}>
          Set up Pointsy for your household in under a minute.
        </p>
        <SignUpForm />
        <p className={styles.alt}>
          Already have an account? <Link href="/sign-in">Sign in</Link>
        </p>
      </section>
    </main>
  );
}
