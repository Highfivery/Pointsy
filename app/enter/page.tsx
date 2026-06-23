import type { Metadata } from "next";
import { KidLogin } from "@/components/enter/KidLogin";
import styles from "@/components/enter/enter.module.css";

export const metadata: Metadata = { title: "Sign in with your PIN" };

export default function EnterPage() {
  return (
    <main id="main" className={styles.main}>
      <section className={styles.shell} aria-labelledby="enter-title">
        <h1 id="enter-title" className={styles.title}>
          Who&rsquo;s signing in?
        </h1>
        <p className={styles.subtitle}>Tap your name and enter your PIN.</p>
        <KidLogin />
      </section>
    </main>
  );
}
