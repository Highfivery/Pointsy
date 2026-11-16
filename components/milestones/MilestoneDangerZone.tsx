import {
  setMilestoneActiveAction,
  deleteMilestoneAction,
} from "@/app/actions/milestones";
import manage from "@/components/manage/manage.module.css";
import styles from "@/components/catalog/catalog.module.css";

/** Pause/resume + delete controls at the bottom of the milestone editor. */
export function MilestoneDangerZone({
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
      <form action={setMilestoneActiveAction}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="isActive" value={(!isActive).toString()} />
        <button type="submit" className={manage.secondaryBtn}>
          {isActive ? "Pause milestone" : "Resume milestone"}
        </button>
      </form>
      <details className={styles.deleteWrap}>
        <summary className={styles.deleteSummary}>Delete</summary>
        <form action={deleteMilestoneAction} className={styles.deleteForm}>
          <input type="hidden" name="id" value={id} />
          <p className={styles.warn}>
            This permanently removes “{title}”. Rewards kids already reached
            stay on your dashboard until you hand them out.
          </p>
          <button type="submit" className={styles.dangerBtn}>
            Delete permanently
          </button>
        </form>
      </details>
    </div>
  );
}
