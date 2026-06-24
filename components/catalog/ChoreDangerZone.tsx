import { setChoreHiddenAction, deleteChoreAction } from "@/app/actions/catalog";
import manage from "@/components/manage/manage.module.css";
import styles from "./catalog.module.css";

/** Hide/show + delete controls shown at the bottom of the chore editor. */
export function ChoreDangerZone({
  id,
  name,
  isActive,
}: {
  id: string;
  name: string;
  isActive: boolean;
}) {
  return (
    <div className={styles.footer}>
      <form action={setChoreHiddenAction}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="isActive" value={(!isActive).toString()} />
        <button type="submit" className={manage.secondaryBtn}>
          {isActive ? "Hide from kids" : "Show to kids"}
        </button>
      </form>
      <details className={styles.deleteWrap}>
        <summary className={styles.deleteSummary}>Delete</summary>
        <form action={deleteChoreAction} className={styles.deleteForm}>
          <input type="hidden" name="id" value={id} />
          <p className={styles.warn}>
            This permanently removes “{name}”. Past history is kept.
          </p>
          <button type="submit" className={styles.dangerBtn}>
            Delete permanently
          </button>
        </form>
      </details>
    </div>
  );
}
