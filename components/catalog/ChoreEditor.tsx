"use client";

import { useActionState, useId, useState } from "react";
import Link from "next/link";
import { Plus, X } from "lucide-react";
import { Field } from "@/components/auth/Field";
import { IconPicker } from "@/components/icons/IconPicker";
import { LogWindowFields } from "@/components/catalog/LogWindowFields";
import { IconByName } from "@/components/icons/registry";
import { ICON_KEYS, DEFAULT_CHORE_ICON } from "@/lib/icons";
import { saveChoreAction } from "@/app/actions/catalog";
import type { FormState } from "@/lib/validation/form";
import type { ChoreAssignment } from "@/lib/db/schema";
import type { LimitPeriod } from "@/lib/catalog/limit";
import form from "@/components/auth/auth-form.module.css";
import styles from "./chore-editor.module.css";

export interface EditorKid {
  id: string;
  name: string;
  avatar: string;
  color: string;
}

export interface EditorCategory {
  id: string;
  name: string;
}

export interface ChoreDefaults {
  id?: string;
  name?: string;
  emoji?: string;
  points?: number;
  categoryId?: string;
  description?: string | null;
  isCore?: boolean;
  assignment?: ChoreAssignment;
  kidIds?: string[];
  subtasks?: string[];
  limitPeriod?: LimitPeriod;
  limitCount?: number;
  logWindowDays?: number | null;
  logWindowStart?: string | null;
  logWindowEnd?: string | null;
}

const ASSIGN_OPTIONS: {
  value: ChoreAssignment;
  label: string;
  hint: string;
}[] = [
  { value: "everyone", label: "Everyone", hint: "Any kid can do it" },
  { value: "specific", label: "Specific kids", hint: "Only the kids you pick" },
  {
    value: "rotating",
    label: "Take turns",
    hint: "Passes to the next kid once the current one does it",
  },
];

const initialState: FormState = {};

export function ChoreEditor({
  kids,
  categories,
  defaults,
}: {
  kids: EditorKid[];
  categories: EditorCategory[];
  defaults?: ChoreDefaults;
}) {
  const [state, action, pending] = useActionState(
    saveChoreAction,
    initialState,
  );
  const errors = state.fieldErrors;
  const [assignment, setAssignment] = useState<ChoreAssignment>(
    defaults?.assignment ?? "everyone",
  );
  const [period, setPeriod] = useState<LimitPeriod>(
    defaults?.limitPeriod ?? "none",
  );
  const [subtasks, setSubtasks] = useState<string[]>(defaults?.subtasks ?? []);
  const categoryId = useId();
  const periodId = useId();
  const selected = new Set(defaults?.kidIds ?? []);

  return (
    <form action={action} className={form.form} noValidate>
      {defaults?.id ? (
        <input type="hidden" name="id" value={defaults.id} />
      ) : null}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Basics</h2>
        <Field
          label="Name"
          name="name"
          defaultValue={defaults?.name}
          error={errors?.name}
          autoComplete="off"
          required
        />
        <IconPicker
          name="emoji"
          label="Icon"
          options={ICON_KEYS}
          defaultValue={defaults?.emoji ?? DEFAULT_CHORE_ICON}
        />
        <Field
          label="Points"
          name="points"
          type="text"
          inputMode="numeric"
          defaultValue={defaults?.points ?? 5}
          error={errors?.points}
          autoComplete="off"
          required
        />
        <div className={form.field}>
          <label htmlFor={categoryId} className={form.label}>
            Category
          </label>
          {categories.length > 0 ? (
            <select
              id={categoryId}
              name="categoryId"
              defaultValue={defaults?.categoryId ?? categories[0].id}
              className={styles.select}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          ) : (
            <p className={styles.muted}>
              No categories yet.{" "}
              <Link href="/manage/categories">Add one first</Link>.
            </p>
          )}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Who &amp; when</h2>
        <fieldset className={styles.choice}>
          <legend className={form.label}>Who&rsquo;s it for?</legend>
          {ASSIGN_OPTIONS.map((o) => (
            <label key={o.value} className={styles.radioRow}>
              <input
                type="radio"
                name="assignment"
                value={o.value}
                checked={assignment === o.value}
                onChange={() => setAssignment(o.value)}
                aria-label={o.label}
              />
              <span className={styles.radioLabel}>{o.label}</span>
              <span className={styles.radioHint}>{o.hint}</span>
            </label>
          ))}
        </fieldset>

        {assignment !== "everyone" ? (
          <fieldset className={styles.kids}>
            <legend className={form.label}>
              {assignment === "rotating" ? "Who takes turns?" : "Which kids?"}
            </legend>
            {kids.length === 0 ? (
              <p className={styles.muted}>
                Add kids first to assign this chore.
              </p>
            ) : (
              kids.map((k) => (
                <label key={k.id} className={styles.kidRow}>
                  <input
                    type="checkbox"
                    name="kidIds"
                    value={k.id}
                    defaultChecked={selected.has(k.id)}
                    aria-label={k.name}
                  />
                  <span
                    className={styles.kidAvatar}
                    style={{ background: k.color }}
                  >
                    <IconByName name={k.avatar} size={18} />
                  </span>
                  {k.name}
                </label>
              ))
            )}
          </fieldset>
        ) : null}

        <label className={styles.coreRow}>
          <input
            type="checkbox"
            name="isCore"
            defaultChecked={defaults?.isCore}
            aria-label="Core chore"
          />
          <span className={styles.radioLabel}>Core chore</span>
          <span className={styles.radioHint}>
            Expected every day — counts toward challenges
          </span>
        </label>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Checklist (optional)</h2>
        <p className={styles.muted}>
          Steps a kid ticks off — they must complete them all to log the chore.
        </p>
        {subtasks.map((step, i) => (
          <div key={i} className={styles.subtaskRow}>
            <input
              className={styles.subtaskInput}
              name="subtasks"
              value={step}
              placeholder={`Step ${i + 1}`}
              aria-label={`Step ${i + 1}`}
              onChange={(e) =>
                setSubtasks((prev) =>
                  prev.map((v, j) => (j === i ? e.target.value : v)),
                )
              }
            />
            <button
              type="button"
              className={styles.subtaskRemove}
              aria-label={`Remove step ${i + 1}`}
              onClick={() =>
                setSubtasks((prev) => prev.filter((_, j) => j !== i))
              }
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        ))}
        <button
          type="button"
          className={styles.addStep}
          onClick={() => setSubtasks((prev) => [...prev, ""])}
        >
          <Plus size={16} aria-hidden="true" />
          Add a step
        </button>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Limits</h2>
        <div className={form.field}>
          <label htmlFor={periodId} className={form.label}>
            How often can a kid claim this?
          </label>
          <select
            id={periodId}
            name="limitPeriod"
            value={period}
            onChange={(e) => setPeriod(e.target.value as LimitPeriod)}
            className={styles.select}
          >
            <option value="none">Unlimited</option>
            <option value="day">A set number per day</option>
            <option value="week">A set number per week</option>
          </select>
          {period === "none" ? (
            <input type="hidden" name="limitCount" value="1" />
          ) : (
            <div className={styles.limitCount}>
              <Field
                label={period === "day" ? "Times per day" : "Times per week"}
                name="limitCount"
                type="text"
                inputMode="numeric"
                defaultValue={defaults?.limitCount ?? 1}
                error={errors?.limitCount}
                autoComplete="off"
                required
              />
            </div>
          )}
        </div>
      </section>

      <LogWindowFields
        defaults={{
          logWindowDays: defaults?.logWindowDays,
          logWindowStart: defaults?.logWindowStart,
          logWindowEnd: defaults?.logWindowEnd,
        }}
      />

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Description</h2>
        <Field
          label="Description (optional)"
          name="description"
          defaultValue={defaults?.description ?? ""}
          maxLength={280}
          error={errors?.description}
          autoComplete="off"
        />
      </section>

      {state.error ? <p className={form.formError}>{state.error}</p> : null}
      <div className={styles.actions}>
        <Link href="/manage/chores" className={styles.cancel}>
          Cancel
        </Link>
        <button type="submit" className={form.submit} disabled={pending}>
          {pending ? "Saving…" : "Save chore"}
        </button>
      </div>
    </form>
  );
}
