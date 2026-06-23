import type { FamilyLookup } from "@/lib/people/service";
import { KidLogin } from "./KidLogin";
import styles from "./enter.module.css";

/**
 * The profile-picker screen shared by the home page (for a device that already
 * knows its family) and /enter (which also accepts a family code).
 */
export function PickerScreen({
  initialFamily,
}: {
  initialFamily: FamilyLookup | null;
}) {
  return (
    <main id="main" className={styles.main}>
      <section className={styles.shell} aria-labelledby="enter-title">
        <h1 id="enter-title" className={styles.title}>
          Who&rsquo;s signing in?
        </h1>
        <p className={styles.subtitle}>Tap your name and enter your PIN.</p>
        <KidLogin initialFamily={initialFamily} />
      </section>
    </main>
  );
}
