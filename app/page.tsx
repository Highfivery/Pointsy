import { Sparkles, ArrowRight } from "lucide-react";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main id="main" className={styles.main}>
      <section className={styles.hero}>
        <p className={styles.badge}>
          <Sparkles size={18} aria-hidden="true" />
          <span>Pointsy</span>
        </p>
        <h1 className={styles.title}>Points that make chores fun.</h1>
        <p className={styles.subtitle}>
          A simple, friendly way for families to earn and redeem points. Parents
          reward good habits; kids watch their points grow and spend them on
          rewards.
        </p>
        <div className={styles.actions}>
          <a className={styles.primary} href="/sign-up">
            Create your family
            <ArrowRight size={18} aria-hidden="true" />
          </a>
          <a className={styles.secondary} href="/sign-in">
            Sign in
          </a>
        </div>
      </section>
    </main>
  );
}
