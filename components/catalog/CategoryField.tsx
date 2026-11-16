"use client";

import { useId, useRef, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { createCategoryInlineAction } from "@/app/actions/categories";
import form from "@/components/auth/auth-form.module.css";
import styles from "./chore-editor.module.css";

export interface CategoryOption {
  id: string;
  name: string;
}

/**
 * The chore editor's Category select, plus an inline "New category" control
 * (issue #182). A parent who wants a group like "Good habits" can add it right
 * here without leaving a half-filled chore. The inline field is not a nested
 * form: its buttons are type="button" and call the server action directly.
 */
export function CategoryField({
  categories: initial,
  defaultValue,
}: {
  categories: CategoryOption[];
  defaultValue?: string;
}) {
  const [categories, setCategories] = useState(initial);
  const [value, setValue] = useState(defaultValue ?? initial[0]?.id ?? "");
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const selectId = useId();
  const newId = useId();
  const errorId = useId();
  const labelId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function open() {
    setAdding(true);
    // The parent just asked to type a name, so move focus to the new field.
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function close() {
    setAdding(false);
    setName("");
    setError(null);
    // Return focus to the control that opened the field.
    requestAnimationFrame(() => toggleRef.current?.focus());
  }

  function add() {
    startTransition(async () => {
      const result = await createCategoryInlineAction(name);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setCategories((prev) => [...prev, result.category]);
      setValue(result.category.id);
      close();
    });
  }

  return (
    <div className={form.field}>
      <label htmlFor={selectId} className={form.label}>
        Category
      </label>
      {categories.length > 0 ? (
        <select
          id={selectId}
          name="categoryId"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={styles.select}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      ) : (
        <p className={styles.muted}>No categories yet.</p>
      )}

      {adding ? (
        <div className={styles.newCategory}>
          <label id={labelId} htmlFor={newId} className={form.label}>
            New category name
          </label>
          <input
            ref={inputRef}
            id={newId}
            aria-labelledby={labelId}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              // Enter would submit the whole chore form; add the category.
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              } else if (e.key === "Escape") {
                e.preventDefault();
                close();
              }
            }}
            maxLength={40}
            autoComplete="off"
            placeholder="e.g. Good habits"
            className={form.input}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
          />
          {error ? (
            <p id={errorId} role="alert" className={form.error}>
              {error}
            </p>
          ) : null}
          <div className={styles.newCategoryActions}>
            <button
              type="button"
              className={styles.addStep}
              onClick={add}
              disabled={pending}
            >
              {pending ? "Adding…" : "Add category"}
            </button>
            <button
              type="button"
              className={styles.cancel}
              onClick={close}
              disabled={pending}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          ref={toggleRef}
          type="button"
          className={styles.addStep}
          onClick={open}
        >
          <Plus size={16} aria-hidden="true" />
          New category
        </button>
      )}
    </div>
  );
}
