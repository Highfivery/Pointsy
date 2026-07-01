import type { FamilyLookup } from "@/lib/people/service";
import { KidLogin } from "./KidLogin";
import { Logo } from "@/components/brand/Logo";
import styles from "./enter.module.css";

/**
 * The profile-picker screen shared by the home page (for a device that already
 * knows its family) and /enter. A branded card centres the flow; KidLogin
 * renders the step-appropriate heading, which the section is labelled by.
 */
export function PickerScreen({
  initialFamily,
}: {
  initialFamily: FamilyLookup | null;
}) {
  return (
    <main id="main" className={styles.main}>
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.brand}>
        <Logo size={34} />
      </div>
      <section className={styles.card} aria-labelledby="enter-title">
        <KidLogin initialFamily={initialFamily} />
      </section>
      <p className={styles.footNote}>
        Free forever · Private by design · No app store
      </p>
    </main>
  );
}
