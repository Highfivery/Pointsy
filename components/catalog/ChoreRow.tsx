import Link from "next/link";
import {
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Star,
  Clock,
} from "lucide-react";
import { IconByName } from "@/components/icons/registry";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { Chip } from "@/components/ui/Chip";
import {
  formatChoreLimit,
  formatLogWindowSummary,
  type LimitPeriod,
} from "@/lib/catalog/limit";
import {
  toggleChorePinnedAction,
  moveCatalogItemAction,
} from "@/app/actions/catalog";
import ui from "@/components/ui/ui.module.css";
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
  /** Logging-window day mask (Mon=0…Sun=6) + bounds, null when unrestricted. */
  logWindowDays: number | null;
  logWindowStart: string | null;
  logWindowEnd: string | null;
}

/** A self-contained chore card — head taps through to the editor. */
export function ChoreRow({ item }: { item: ChoreRowItem }) {
  const freq = formatChoreLimit(item.limitPeriod, item.limitCount);
  const window = formatLogWindowSummary(
    item.logWindowDays,
    item.logWindowStart,
    item.logWindowEnd,
  );
  return (
    <Card>
      <Link href={`/manage/chores/${item.id}`} className={styles.rowLink}>
        <span className={styles.emoji}>
          <IconByName name={item.emoji} size={24} />
        </span>
        <span className={styles.rowText}>
          <span className={styles.name}>{item.name}</span>
          <span className={styles.metaRow}>
            <Chip variant="accent">{item.points} pts</Chip>
            {item.isCore ? <Chip variant="neutral">Core</Chip> : null}
            {item.whoLabel ? (
              <Chip variant="neutral">{item.whoLabel}</Chip>
            ) : null}
            {freq ? <Chip variant="muted">{freq}</Chip> : null}
            {window ? (
              <Chip variant="muted">
                <Clock size={12} aria-hidden="true" />
                {window}
              </Chip>
            ) : null}
            {!item.isActive ? <Chip variant="warning">Hidden</Chip> : null}
          </span>
        </span>
        <ChevronRight
          size={20}
          aria-hidden="true"
          className={styles.rowChevron}
        />
      </Link>

      <div className={ui.actionRow}>
        <form action={toggleChorePinnedAction} className={ui.inlineForm}>
          <input type="hidden" name="id" value={item.id} />
          <input
            type="hidden"
            name="pinned"
            value={(!item.pinned).toString()}
          />
          <IconButton
            type="submit"
            variant={item.pinned ? "accent" : "default"}
            aria-pressed={item.pinned}
            label={item.pinned ? `Unpin ${item.name}` : `Pin ${item.name}`}
          >
            <Star
              size={18}
              aria-hidden="true"
              fill={item.pinned ? "currentColor" : "none"}
            />
          </IconButton>
        </form>
        <form action={moveCatalogItemAction} className={styles.reorder}>
          <input type="hidden" name="kind" value="chore" />
          <input type="hidden" name="id" value={item.id} />
          <IconButton
            type="submit"
            name="direction"
            value="up"
            label={`Move ${item.name} up`}
          >
            <ChevronUp size={18} aria-hidden="true" />
          </IconButton>
          <IconButton
            type="submit"
            name="direction"
            value="down"
            label={`Move ${item.name} down`}
          >
            <ChevronDown size={18} aria-hidden="true" />
          </IconButton>
        </form>
      </div>
    </Card>
  );
}
