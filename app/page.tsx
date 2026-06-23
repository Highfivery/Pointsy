import {
  Sparkles,
  ArrowRight,
  UsersRound,
  Mail,
  ChevronRight,
} from "lucide-react";
import { getKnownFamily } from "@/lib/auth/device";
import { PickerScreen } from "@/components/enter/PickerScreen";
import styles from "./page.module.css";

export default async function Home() {
  // A device that's already used Pointsy goes straight to its family's profile
  // picker (PIN required) — never the marketing page or a sign-in form.
  const family = await getKnownFamily();
  if (family) return <PickerScreen initialFamily={family} />;

  // Brand-new visitor: marketing + the ways in.
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
            Parent sign in
          </a>
        </div>

        <div className={styles.joining}>
          <h2 className={styles.joinTitle}>Already part of a family?</h2>
          <ul className={styles.joinList}>
            <li>
              <a href="/enter" className={styles.joinLink}>
                <span className={styles.joinIcon}>
                  <UsersRound size={22} aria-hidden="true" />
                </span>
                <span className={styles.joinText}>
                  <span className={styles.joinLabel}>Kids &amp; family</span>
                  <span className={styles.joinHint}>
                    Enter your family code
                  </span>
                </span>
                <ChevronRight
                  size={20}
                  aria-hidden="true"
                  className={styles.joinChevron}
                />
              </a>
            </li>
            <li>
              <a href="/join" className={styles.joinLink}>
                <span className={styles.joinIcon}>
                  <Mail size={22} aria-hidden="true" />
                </span>
                <span className={styles.joinText}>
                  <span className={styles.joinLabel}>
                    Invited as a co-parent?
                  </span>
                  <span className={styles.joinHint}>
                    Enter your invite code
                  </span>
                </span>
                <ChevronRight
                  size={20}
                  aria-hidden="true"
                  className={styles.joinChevron}
                />
              </a>
            </li>
          </ul>
        </div>
      </section>
    </main>
  );
}
