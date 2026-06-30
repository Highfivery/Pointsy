import type { Metadata } from "next";
import Link from "next/link";
import { SignInForm } from "@/components/auth/SignInForm";
import { Logo } from "@/components/brand/Logo";
import styles from "../auth.module.css";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Pointsy parent account.",
  alternates: { canonical: "/sign-in" },
};

export default function SignInPage() {
  return (
    <main id="main" className={styles.main}>
      <section className={styles.card} aria-labelledby="signin-title">
        <div className={styles.intro}>
          <Logo size={28} />
          <h1 id="signin-title" className={styles.title}>
            Welcome back
          </h1>
          <p className={styles.subtitle}>
            Sign in to your Pointsy parent account.
          </p>
        </div>
        <SignInForm />
        <p className={styles.alt}>
          New here? <Link href="/sign-up">Create your family</Link>
        </p>
      </section>
    </main>
  );
}
