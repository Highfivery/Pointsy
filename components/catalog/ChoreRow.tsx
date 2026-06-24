import Link from "next/link";
import { ChevronRight, ChevronUp, ChevronDown, Star } from "lucide-react";
import { IconByName } from "@/components/icons/registry";
import { formatChoreLimit, type LimitPeriod } from "@/lib/catalog/limit";
import {
  toggleChorePinnedAction,
  moveCatalogItemAction,
} from "@/app/actions/catalog";
import manage from "@/components/manage/manage.module.css";
import styles from "./catalog.module.css";

export interface ChoreRowItem {
  id: string;
  name: string;
  emoji: string;
  points: number;
  isActive: boolean;
  pinned: boolean;
  isCore: boolean;
  limitPeriod: LimitPeriod;
  limitCount: number;
  /** "Robin's turn" / "Robin, Sky" / null for everyone. */
  whoLabel: string | null;
}

/** A chore in the management overview — taps through to the editor. */
export function ChoreRow({ item }: { item: ChoreRowItem }) {
  const freq = formatChoreLimit(item.limitPeriod, item.limitCount);
  return (
    <div className={styles.row}>
      <Link href={`/manage/chores/${item.id}`} className={styles.rowLink}>
        <span className={styles.emoji}>
          <IconByName name={item.emoji} size={24} />
        </span>
        <span className={styles.rowText}>
          <span className={manage.kidName}>{item.name}</span>
          <span className={styles.metaRow}>
            <span className={styles.value}>{item.points} pts</span>
            {item.isCore ? <span className={styles.coreChip}>Core</span> : null}
            {item.whoLabel ? (
              <span className={styles.whoChip}>{item.whoLabel}</span>
            ) : null}
            {freq ? <span className={styles.limitMeta}>{freq}</span> : null}
            {!item.isActive ? (
              <span className={manage.inactive}>Hidden</span>
            ) : null}
          </span>
        </span>
        <ChevronRight
          size={20}
          aria-hidden="true"
          className={styles.rowChevron}
        />
      </Link>
      <div className={styles.rowActions}>
        <form action={toggleChorePinnedAction} className={styles.pinForm}>
          <input type="hidden" name="id" value={item.id} />
          <input
            type="hidden"
            name="pinned"
            value={(!item.pinned).toString()}
          />
          <button
            type="submit"
            className={item.pinned ? styles.pinOn : styles.iconBtn}
            aria-pressed={item.pinned}
            aria-label={item.pinned ? `Unpin ${item.name}` : `Pin ${item.name}`}
          >
            <Star
              size={18}
              aria-hidden="true"
              fill={item.pinned ? "currentColor" : "none"}
            />
          </button>
        </form>
        <form action={moveCatalogItemAction} className={styles.reorder}>
          <input type="hidden" name="kind" value="chore" />
          <input type="hidden" name="id" value={item.id} />
          <button
            type="submit"
            name="direction"
            value="up"
            className={styles.iconBtn}
            aria-label={`Move ${item.name} up`}
          >
            <ChevronUp size={18} aria-hidden="true" />
          </button>
          <button
            type="submit"
            name="direction"
            value="down"
            className={styles.iconBtn}
            aria-label={`Move ${item.name} down`}
          >
            <ChevronDown size={18} aria-hidden="true" />
          </button>
        </form>
      </div>
    </div>
  );
}
