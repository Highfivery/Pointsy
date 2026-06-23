"use client";

import { useActionState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import {
  updateCatalogItemAction,
  toggleCatalogItemActiveAction,
  moveCatalogItemAction,
  deleteCatalogItemAction,
} from "@/app/actions/catalog";
import { CatalogFields, type CatalogKind } from "./CatalogFields";
import type { FormState } from "@/lib/validation/form";
import form from "@/components/auth/auth-form.module.css";
import manage from "@/components/manage/manage.module.css";
import styles from "./catalog.module.css";

export interface CatalogItem {
  id: string;
  name: string;
  emoji: string;
  value: number;
  description: string | null;
  isActive: boolean;
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
    <section className={manage.card} aria-label={`Manage ${item.name}`}>
      <div className={styles.head}>
        <span className={styles.emoji} aria-hidden="true">
          {item.emoji}
        </span>
        <div className={styles.headText}>
          <span className={manage.kidName}>{item.name}</span>
          <span className={styles.value}>{item.value} pts</span>
          {item.description ? (
            <span className={styles.desc}>{item.description}</span>
          ) : null}
        </div>
        {!item.isActive ? (
          <span className={manage.inactive}>Hidden</span>
        ) : null}
        <form action={moveCatalogItemAction} className={styles.reorder}>
          <input type="hidden" name="kind" value={kind} />
          <input type="hidden" name="id" value={item.id} />
          <button
            type="submit"
            name="direction"
            value="up"
            className={styles.iconBtn}
            aria-label={`Move ${item.name} up`}
          >
            <ChevronUp size={20} aria-hidden="true" />
          </button>
          <button
            type="submit"
            name="direction"
            value="down"
            className={styles.iconBtn}
            aria-label={`Move ${item.name} down`}
          >
            <ChevronDown size={20} aria-hidden="true" />
          </button>
        </form>
      </div>

      <details className={manage.disclosure}>
        <summary className={manage.summary}>Edit</summary>
        <form action={editAction} className={form.form} noValidate>
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
            }}
          />
          <button type="submit" className={form.submit} disabled={editPending}>
            {editPending ? "Saving…" : "Save changes"}
          </button>
          {editState.ok ? <p className={manage.success}>Saved.</p> : null}
        </form>
      </details>

      <div className={styles.footer}>
        <form action={toggleCatalogItemActiveAction}>
          <input type="hidden" name="kind" value={kind} />
          <input type="hidden" name="id" value={item.id} />
          <input
            type="hidden"
            name="isActive"
            value={(!item.isActive).toString()}
          />
          <button type="submit" className={manage.secondaryBtn}>
            {item.isActive ? "Hide" : "Show"}
          </button>
        </form>

        <details className={styles.deleteWrap}>
          <summary className={styles.deleteSummary}>Delete</summary>
          <form action={deleteCatalogItemAction} className={styles.deleteForm}>
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
    </section>
  );
}
