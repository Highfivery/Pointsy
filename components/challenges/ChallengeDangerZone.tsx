import {
  setChallengeActiveAction,
  deleteChallengeAction,
} from "@/app/actions/challenges";
import manage from "@/components/manage/manage.module.css";
import styles from "@/components/catalog/catalog.module.css";

/** Pause/resume + delete controls at the bottom of the challenge editor. */
export function ChallengeDangerZone({
  id,
  title,
  isActive,
}: {
  id: string;
  title: string;
  isActive: boolean;
}) {
  return (
    <div className={styles.footer}>
      <form action={setChallengeActiveAction}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="isActive" value={(!isActive).toString()} />
        <button type="submit" className={manage.secondaryBtn}>
          {isActive ? "Pause challenge" : "Resume challenge"}
        </button>
      </form>
      <details className={styles.deleteWrap}>
        <summary className={styles.deleteSummary}>Delete</summary>
        <form action={deleteChallengeAction} className={styles.deleteForm}>
          <input type="hidden" name="id" value={id} />
          <p className={styles.warn}>
            This permanently removes “{title}”. Bonuses already paid are kept.
          </p>
          <button type="submit" className={styles.dangerBtn}>
            Delete permanently
          </button>
        </form>
      </details>
    </div>
  );
}
