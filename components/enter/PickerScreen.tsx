import type { FamilyLookup } from "@/lib/people/service";
import { KidLogin } from "./KidLogin";
import { Logo } from "@/components/brand/Logo";
import styles from "./enter.module.css";

/**
 * The profile-picker screen shared by the home page (for a device that already
 * knows its family) and /enter. KidLogin renders the step-appropriate heading,
 * which the section is labelled by.
 */
export function PickerScreen({
  initialFamily,
}: {
  initialFamily: FamilyLookup | null;
}) {
  return (
    <main id="main" className={styles.main}>
      <section className={styles.shell} aria-labelledby="enter-title">
        <div className={styles.brand}>
          <Logo size={28} />
        </div>
        <KidLogin initialFamily={initialFamily} />
      </section>
    </main>
  );
}
