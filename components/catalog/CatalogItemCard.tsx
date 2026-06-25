"use client";

import { useActionState } from "react";
import {
  ChevronUp,
  ChevronDown,
  Star,
  Pencil,
  Eye,
  EyeOff,
  Trash2,
} from "lucide-react";
import {
  updateCatalogItemAction,
  toggleCatalogItemActiveAction,
  toggleChorePinnedAction,
  moveCatalogItemAction,
  deleteCatalogItemAction,
} from "@/app/actions/catalog";
import { CatalogFields, type CatalogKind } from "./CatalogFields";
import { IconByName } from "@/components/icons/registry";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { Chip } from "@/components/ui/Chip";
import { formatChoreLimit, type LimitPeriod } from "@/lib/catalog/limit";
import type { FormState } from "@/lib/validation/form";
import form from "@/components/auth/auth-form.module.css";
import manage from "@/components/manage/manage.module.css";
import ui from "@/components/ui/ui.module.css";
import styles from "./catalog.module.css";

export interface CatalogItem {
  id: string;
  name: string;
  emoji: string;
  value: number;
  description: string | null;
  isActive: boolean;
  category?: string;
  pinned?: boolean;
  limitPeriod?: LimitPeriod;
  limitCount?: number;
  isTeam?: boolean;
  minKids?: number;
  allowSolo?: boolean;
}

const initialState: FormState = {};

export function CatalogItemCard({
  kind,
  item,
}: {
  kind: CatalogKind;
  item: CatalogItem;
}) {
  const [editState, editAction, editPending] = useActionState(
    updateCatalogItemAction,
    initialState,
  );

  return (
    <Card aria-label={`Manage ${item.name}`}>
      <div className={styles.head}>
        <span className={styles.emoji}>
          <IconByName name={item.emoji} size={26} />
        </span>
        <div className={styles.headText}>
          <span className={styles.name}>{item.name}</span>
          <div className={styles.metaRow}>
            <Chip variant="accent">{item.value} pts</Chip>
            {kind === "chore" &&
            item.limitPeriod &&
            item.limitPeriod !== "none" ? (
              <Chip variant="neutral">
                {formatChoreLimit(item.limitPeriod, item.limitCount ?? 1)}
              </Chip>
            ) : null}
            {!item.isActive ? <Chip variant="warning">Hidden</Chip> : null}
          </div>
          {item.description ? (
            <span className={styles.desc}>{item.description}</span>
          ) : null}
        </div>
        <div className={styles.controls}>
          {kind === "chore" ? (
            <form action={toggleChorePinnedAction} className={styles.pinForm}>
              <input type="hidden" name="id" value={item.id} />
              <input
                type="hidden"
                name="pinned"
                value={(!item.pinned).toString()}
              />
              <IconButton
                type="submit"
                variant={item.pinned ? "accent" : "default"}
                aria-pressed={Boolean(item.pinned)}
                label={
                  item.pinned
                    ? `Unpin ${item.name}`
                    : `Pin ${item.name} to the top`
                }
              >
                <Star
                  size={18}
                  aria-hidden="true"
                  fill={item.pinned ? "currentColor" : "none"}
                />
              </IconButton>
            </form>
          ) : null}
          <form action={moveCatalogItemAction} className={styles.reorder}>
            <input type="hidden" name="kind" value={kind} />
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
      </div>

      <div className={ui.actionRow}>
        <details className={ui.actionDisclosure}>
          <summary
            className={`${ui.iconBtn} ${ui.iconSummary}`}
            aria-label={`Edit ${item.name}`}
            title="Edit"
          >
            <Pencil size={18} aria-hidden="true" />
          </summary>
          <form
            action={editAction}
            className={`${form.form} ${ui.actionPanel}`}
            noValidate
          >
            <input type="hidden" name="kind" value={kind} />
            <input type="hidden" name="id" value={item.id} />
            <CatalogFields
              kind={kind}
              errors={editState.fieldErrors}
              defaults={{
                name: item.name,
                emoji: item.emoji,
                value: item.value,
                description: item.description,
                category: item.category,
                limitPeriod: item.limitPeriod,
                limitCount: item.limitCount,
                isTeam: item.isTeam,
                minKids: item.minKids,
                allowSolo: item.allowSolo,
              }}
            />
            <button
              type="submit"
              className={form.submit}
              disabled={editPending}
            >
              {editPending ? "Saving…" : "Save changes"}
            </button>
            {editState.ok ? <p className={manage.success}>Saved.</p> : null}
          </form>
        </details>

        <form action={toggleCatalogItemActiveAction} className={ui.inlineForm}>
          <input type="hidden" name="kind" value={kind} />
          <input type="hidden" name="id" value={item.id} />
          <input
            type="hidden"
            name="isActive"
            value={(!item.isActive).toString()}
          />
          <IconButton
            type="submit"
            label={item.isActive ? "Hide from kids" : "Show to kids"}
          >
            {item.isActive ? (
              <EyeOff size={18} aria-hidden="true" />
            ) : (
              <Eye size={18} aria-hidden="true" />
            )}
          </IconButton>
        </form>

        <details className={`${ui.actionDisclosure} ${ui.pushRight}`}>
          <summary
            className={`${ui.iconBtn} ${ui.danger} ${ui.iconSummary}`}
            aria-label={`Delete ${item.name}`}
            title="Delete"
          >
            <Trash2 size={18} aria-hidden="true" />
          </summary>
          <form
            action={deleteCatalogItemAction}
            className={`${ui.actionPanel} ${styles.deleteForm}`}
          >
            <input type="hidden" name="kind" value={kind} />
            <input type="hidden" name="id" value={item.id} />
            <p className={styles.warn}>
              This permanently removes “{item.name}”. Past history is kept.
            </p>
            <button type="submit" className={styles.dangerBtn}>
              Delete permanently
            </button>
          </form>
        </details>
      </div>
    </Card>
  );
}
