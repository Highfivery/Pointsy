"use client";

import { useActionState, useEffect, useRef } from "react";
import { ChevronUp, ChevronDown, Pencil, Plus, Trash2 } from "lucide-react";
import {
  createCategoryAction,
  updateCategoryAction,
  moveCategoryAction,
  deleteCategoryAction,
} from "@/app/actions/categories";
import { Field } from "@/components/auth/Field";
import { IconPicker } from "@/components/icons/IconPicker";
import { IconByName } from "@/components/icons/registry";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { Chip } from "@/components/ui/Chip";
import { CHORE_ICON_KEYS } from "@/lib/icons";
import type { FormState } from "@/lib/validation/form";
import form from "@/components/auth/auth-form.module.css";
import manage from "@/components/manage/manage.module.css";
import ui from "@/components/ui/ui.module.css";
import styles from "./category-manager.module.css";

export interface ManagedCategory {
  id: string;
  name: string;
  icon: string;
  choreCount: number;
}

const initial: FormState = {};

function chores(n: number) {
  return `${n} ${n === 1 ? "chore" : "chores"}`;
}

/** Add / edit / reorder / delete the family's chore categories. */
export function CategoryManager({
  categories,
}: {
  categories: ManagedCategory[];
}) {
  return (
    <>
      <AddCategory />
      <ul className={manage.list}>
        {categories.map((c) => (
          <li key={c.id}>
            <CategoryCard
              category={c}
              others={categories.filter((o) => o.id !== c.id)}
              isOnly={categories.length <= 1}
            />
          </li>
        ))}
      </ul>
    </>
  );
}

function AddCategory() {
  const [state, action, pending] = useActionState(
    createCategoryAction,
    initial,
  );
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state.ok]);

  return (
    <details className={styles.addCard}>
      <summary className={styles.addSummary}>
        <Plus size={18} aria-hidden="true" />
        Add a category
      </summary>
      <form ref={ref} action={action} className={form.form} noValidate>
        <Field
          label="Name"
          name="name"
          autoComplete="off"
          error={state.fieldErrors?.name}
          required
        />
        <IconPicker
          name="icon"
          label="Icon"
          options={CHORE_ICON_KEYS}
          defaultValue="sparkles"
        />
        {state.error ? (
          <p role="alert" className={form.formError}>
            {state.error}
          </p>
        ) : null}
        <button type="submit" className={form.submit} disabled={pending}>
          {pending ? "Adding…" : "Add category"}
        </button>
        {state.ok ? <p className={manage.success}>Added.</p> : null}
      </form>
    </details>
  );
}

function CategoryCard({
  category,
  others,
  isOnly,
}: {
  category: ManagedCategory;
  others: ManagedCategory[];
  isOnly: boolean;
}) {
  const [editState, editAction, editPending] = useActionState(
    updateCategoryAction,
    initial,
  );
  const [delState, delAction, delPending] = useActionState(
    deleteCategoryAction,
    initial,
  );
  const hasChores = category.choreCount > 0;

  return (
    <Card aria-label={`Manage ${category.name}`}>
      <div className={styles.row}>
        <span className={styles.icon}>
          <IconByName name={category.icon} size={24} />
        </span>
        <div className={styles.text}>
          <span className={styles.name}>{category.name}</span>
          <Chip variant="neutral">{chores(category.choreCount)}</Chip>
        </div>
        <form action={moveCategoryAction} className={styles.reorder}>
          <input type="hidden" name="id" value={category.id} />
          <IconButton
            type="submit"
            name="direction"
            value="up"
            label={`Move ${category.name} up`}
          >
            <ChevronUp size={18} aria-hidden="true" />
          </IconButton>
          <IconButton
            type="submit"
            name="direction"
            value="down"
            label={`Move ${category.name} down`}
          >
            <ChevronDown size={18} aria-hidden="true" />
          </IconButton>
        </form>
      </div>

      <div className={ui.actionRow}>
        <details className={ui.actionDisclosure}>
          <summary
            className={`${ui.iconBtn} ${ui.iconSummary}`}
            aria-label={`Edit ${category.name}`}
            title="Edit"
          >
            <Pencil size={18} aria-hidden="true" />
          </summary>
          <form
            action={editAction}
            className={`${form.form} ${ui.actionPanel}`}
            noValidate
          >
            <input type="hidden" name="id" value={category.id} />
            <Field
              label="Name"
              name="name"
              defaultValue={category.name}
              autoComplete="off"
              error={editState.fieldErrors?.name}
              required
            />
            <IconPicker
              name="icon"
              label="Icon"
              options={CHORE_ICON_KEYS}
              defaultValue={category.icon}
            />
            {editState.error ? (
              <p role="alert" className={form.formError}>
                {editState.error}
              </p>
            ) : null}
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

        <details className={`${ui.actionDisclosure} ${ui.pushRight}`}>
          <summary
            className={`${ui.iconBtn} ${ui.danger} ${ui.iconSummary}`}
            aria-label={`Delete ${category.name}`}
            title="Delete"
          >
            <Trash2 size={18} aria-hidden="true" />
          </summary>
          <form
            action={delAction}
            className={`${ui.actionPanel} ${styles.deleteForm}`}
          >
            <input type="hidden" name="id" value={category.id} />
            {isOnly ? (
              <p className={styles.warn}>
                This is your only category — add another before removing it.
              </p>
            ) : hasChores ? (
              <>
                <p className={styles.warn}>
                  “{category.name}” has {chores(category.choreCount)}. Move{" "}
                  {category.choreCount === 1 ? "it" : "them"} to:
                </p>
                <select
                  name="reassignTo"
                  className={styles.select}
                  defaultValue={others[0]?.id}
                  aria-label="Move chores to"
                >
                  {others.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </>
            ) : (
              <p className={styles.warn}>
                Remove “{category.name}”. This can’t be undone.
              </p>
            )}
            {delState.error ? (
              <p role="alert" className={form.formError}>
                {delState.error}
              </p>
            ) : null}
            <button
              type="submit"
              className={styles.dangerBtn}
              disabled={delPending || isOnly}
            >
              {hasChores ? "Move chores & delete" : "Delete category"}
            </button>
          </form>
        </details>
      </div>
    </Card>
  );
}
