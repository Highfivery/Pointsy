import type { Metadata } from "next";
import Link from "next/link";
import { SignUpForm } from "@/components/auth/SignUpForm";
import styles from "../auth.module.css";

export const metadata: Metadata = { title: "Create your family" };

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
