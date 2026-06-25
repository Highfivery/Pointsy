"use client";

import { useActionState, useId, useState } from "react";
import { Field } from "@/components/auth/Field";
import { IconByName } from "@/components/icons/registry";
import { saveChallengeAction } from "@/app/actions/challenges";
import type { FormState } from "@/lib/validation/form";
import type {
  ChallengeScope,
  ChallengeGoal,
  ChallengeRecurrence,
} from "@/lib/db/schema";
import form from "@/components/auth/auth-form.module.css";
import styles from "@/components/catalog/chore-editor.module.css";

export interface EditorKid {
  id: string;
  name: string;
  avatar: string;
  color: string;
}

export interface ChallengeDefaults {
  id?: string;
  title?: string;
  description?: string | null;
  scope?: ChallengeScope;
  recurrence?: ChallengeRecurrence;
  goalType?: ChallengeGoal;
  goalTarget?: number;
  bonusPoints?: number;
  autoAward?: boolean;
  startsOn?: string;
  endsOn?: string;
  kidIds?: string[];
}

const SCOPE_OPTIONS: { value: ChallengeScope; label: string; hint: string }[] =
  [
    {
      value: "kid",
      label: "Each kid",
      hint: "Everyone works toward it on their own",
    },
    { value: "family", label: "Whole family", hint: "You all share one tally" },
  ];

const GOALS: {
  value: ChallengeGoal;
  label: string;
  targetLabel: string;
}[] = [
  { value: "points", label: "Earn points", targetLabel: "Points to earn" },
  { value: "chore_count", label: "Log chores", targetLabel: "Chores to log" },
  {
    value: "core_days",
    label: "Core-chore days",
    targetLabel: "Days with all core chores done",
  },
];

const RECUR_OPTIONS: {
  value: ChallengeRecurrence;
  label: string;
  hint: string;
}[] = [
  { value: "none", label: "One-off", hint: "Runs once over these dates" },
  {
    value: "weekly",
    label: "Every week",
    hint: "Resets each week — earn the bonus again",
  },
];

const initialState: FormState = {};

export function ChallengeEditor({
  kids,
  defaults,
}: {
  kids: EditorKid[];
  defaults?: ChallengeDefaults;
}) {
  const [state, action, pending] = useActionState(
    saveChallengeAction,
    initialState,
  );
  const errors = state.fieldErrors;
  const [scope, setScope] = useState<ChallengeScope>(defaults?.scope ?? "kid");
  const [recurrence, setRecurrence] = useState<ChallengeRecurrence>(
    defaults?.recurrence ?? "none",
  );
  const [goalType, setGoalType] = useState<ChallengeGoal>(
    defaults?.goalType ?? "points",
  );
  const goalId = useId();
  const selected = new Set(defaults?.kidIds ?? []);
  const targetLabel =
    GOALS.find((g) => g.value === goalType)?.targetLabel ?? "Target";

  return (
    <form action={action} className={form.form} noValidate>
      {defaults?.id ? (
        <input type="hidden" name="id" value={defaults.id} />
      ) : null}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Basics</h2>
        <Field
          label="Name"
          name="title"
          defaultValue={defaults?.title}
          error={errors?.title}
          placeholder="e.g. Super Saver Week"
          required
        />
        <Field
          label="Description"
          name="description"
          defaultValue={defaults?.description ?? undefined}
          error={errors?.description}
          placeholder="Optional — a line of encouragement"
        />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>The goal</h2>
        <fieldset className={styles.choice}>
          <legend className={form.label}>Who&rsquo;s it for?</legend>
          {SCOPE_OPTIONS.map((o) => (
            <label key={o.value} className={styles.radioRow}>
              <input
                type="radio"
                name="scope"
                value={o.value}
                checked={scope === o.value}
                onChange={() => setScope(o.value)}
                aria-label={o.label}
              />
              <span className={styles.radioLabel}>{o.label}</span>
              <span className={styles.radioHint}>{o.hint}</span>
            </label>
          ))}
        </fieldset>

        <div className={form.field}>
          <label htmlFor={goalId} className={form.label}>
            Measure
          </label>
          <select
            id={goalId}
            name="goalType"
            value={goalType}
            onChange={(e) => setGoalType(e.target.value as ChallengeGoal)}
            className={styles.select}
          >
            {GOALS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>

        <Field
          label={targetLabel}
          name="goalTarget"
          type="number"
          inputMode="numeric"
          min={1}
          defaultValue={defaults?.goalTarget}
          error={errors?.goalTarget}
          required
        />
        <Field
          label="Bonus points when completed"
          name="bonusPoints"
          type="number"
          inputMode="numeric"
          min={1}
          defaultValue={defaults?.bonusPoints}
          error={errors?.bonusPoints}
          hint={
            scope === "family"
              ? "Each kid gets the full bonus when the family hits the goal."
              : undefined
          }
          required
        />
        <label className={styles.coreRow}>
          <input
            type="checkbox"
            name="needsApproval"
            defaultChecked={defaults?.autoAward === false}
            aria-label="Hold the bonus until I approve it"
          />
          <span className={styles.radioLabel}>
            Hold the bonus until I approve it
          </span>
        </label>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>When</h2>
        <fieldset className={styles.choice}>
          <legend className={form.label}>Repeat</legend>
          {RECUR_OPTIONS.map((o) => (
            <label key={o.value} className={styles.radioRow}>
              <input
                type="radio"
                name="recurrence"
                value={o.value}
                checked={recurrence === o.value}
                onChange={() => setRecurrence(o.value)}
                aria-label={o.label}
              />
              <span className={styles.radioLabel}>{o.label}</span>
              <span className={styles.radioHint}>{o.hint}</span>
            </label>
          ))}
        </fieldset>
        <Field
          label="Starts"
          name="startsOn"
          type="date"
          defaultValue={defaults?.startsOn}
          error={errors?.startsOn}
          required
        />
        <Field
          label="Ends"
          name="endsOn"
          type="date"
          defaultValue={defaults?.endsOn}
          error={errors?.endsOn}
          required
        />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Who&rsquo;s in it?</h2>
        <fieldset className={styles.kids}>
          <legend className={form.label}>
            Tick the kids — or leave empty for the whole family.
          </legend>
          {kids.length === 0 ? (
            <p className={styles.muted}>Add kids first to run a challenge.</p>
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
                <span>{k.name}</span>
              </label>
            ))
          )}
        </fieldset>
      </section>

      {state.error ? (
        <p className={form.error} role="alert">
          {state.error}
        </p>
      ) : null}

      <button type="submit" className={form.submit} disabled={pending}>
        {pending ? "Saving…" : "Save challenge"}
      </button>
    </form>
  );
}
