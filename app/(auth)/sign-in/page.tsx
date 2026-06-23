import type { Metadata } from "next";
import Link from "next/link";
import { SignInForm } from "@/components/auth/SignInForm";
import styles from "../auth.module.css";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <main id="main" className={styles.main}>
      <section className={styles.card} aria-labelledby="signin-title">
        <h1 id="signin-title" className={styles.title}>
          Welcome back
        </h1>
        <p className={styles.subtitle}>
          Sign in to your Pointsy parent account.
        </p>
        <SignInForm />
        <p className={styles.alt}>
          New here? <Link href="/sign-up">Create your family</Link>
        </p>
      </section>
    </main>
  );
}
