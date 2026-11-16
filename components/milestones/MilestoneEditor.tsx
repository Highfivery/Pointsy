"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { Field } from "@/components/auth/Field";
import { IconByName } from "@/components/icons/registry";
import { saveMilestoneAction } from "@/app/actions/milestones";
import type { FormState } from "@/lib/validation/form";
import type { MilestoneStart } from "@/lib/db/schema";
import form from "@/components/auth/auth-form.module.css";
import styles from "@/components/catalog/chore-editor.module.css";
import own from "./milestones.module.css";

export interface MilestoneEditorKid {
  id: string;
  name: string;
  avatar: string;
  color: string;
  /** Points this kid has earned, ever. */
  lifetime: number;
}

export interface MilestoneDefaults {
  id?: string;
  title?: string;
  reward?: string;
  target?: number;
  repeats?: boolean;
  startMode?: MilestoneStart;
  allKids?: boolean;
  kidIds?: string[];
}

const initialState: FormState = {};

const fmt = (n: number) => n.toLocaleString("en-US");

export function MilestoneEditor({
  kids,
  defaults,
  locked = false,
}: {
  kids: MilestoneEditorKid[];
  defaults?: MilestoneDefaults;
  /** Already reached by a kid: points and repeat setting can't change. */
  locked?: boolean;
}) {
  const [state, action, pending] = useActionState(
    saveMilestoneAction,
    initialState,
  );
  const errors = state.fieldErrors;
  const editing = Boolean(defaults?.id);
  const [target, setTarget] = useState(String(defaults?.target ?? ""));
  const [repeats, setRepeats] = useState(defaults?.repeats ?? false);
  const [startMode, setStartMode] = useState<MilestoneStart>(
    defaults?.startMode ?? "from_now",
  );
  const [allKids, setAllKids] = useState(defaults?.allKids ?? true);
  const [picked, setPicked] = useState<Set<string>>(
    new Set(defaults?.kidIds ?? []),
  );

  const targetNum = Number(target);
  // Only "all points so far" counts history, so only then can a kid already be
  // past the target when it's saved.
  const alreadyPast =
    !editing && startMode === "lifetime" && targetNum > 0
      ? kids.filter(
          (k) => (allKids || picked.has(k.id)) && k.lifetime >= targetNum,
        )
      : [];

  function toggle(id: string, on: boolean) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

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
          placeholder="e.g. Super saver"
          autoComplete="off"
          required
        />
        <Field
          label="Reward"
          name="reward"
          defaultValue={defaults?.reward}
          error={errors?.reward}
          placeholder="e.g. A trip to the zoo"
          hint="Something real you’ll hand out — not more points."
          autoComplete="off"
          required
        />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>The goal</h2>
        {locked ? (
          <p className={own.lockNote}>
            <Lock size={16} aria-hidden="true" />
            Already reached, so the points and repeat setting are locked. Make a
            new milestone to change them.
          </p>
        ) : null}
        {locked ? (
          <>
            <input type="hidden" name="target" value={target} />
            <input
              type="hidden"
              name="repeats"
              value={repeats ? "repeat" : "once"}
            />
          </>
        ) : null}
        <Field
          label="Points earned"
          name={locked ? "targetShown" : "target"}
          type="text"
          inputMode="numeric"
          value={target}
          onChange={(e) => setTarget(e.target.value.replace(/[^\d]/g, ""))}
          error={errors?.target}
          disabled={locked}
          placeholder="e.g. 1000"
          autoComplete="off"
          required
        />
        <fieldset className={styles.choice} disabled={locked}>
          <legend className={form.label}>How often?</legend>
          <label className={styles.radioRow}>
            <input
              type="radio"
              name={locked ? undefined : "repeats"}
              value="once"
              checked={!repeats}
              onChange={() => setRepeats(false)}
              aria-label="One time"
            />
            <span className={styles.radioLabel}>One time</span>
            <span className={styles.radioHint}>
              Unlocks once when they reach it
            </span>
          </label>
          <label className={styles.radioRow}>
            <input
              type="radio"
              name={locked ? undefined : "repeats"}
              value="repeat"
              checked={repeats}
              onChange={() => setRepeats(true)}
              aria-label="Every time"
            />
            <span className={styles.radioLabel}>Every time</span>
            <span className={styles.radioHint}>
              Unlocks again for every{" "}
              {targetNum > 0 ? fmt(targetNum) : "that many"} points earned
            </span>
          </label>
        </fieldset>

        {editing ? (
          <>
            <input type="hidden" name="startMode" value={startMode} />
            <p className={styles.muted}>
              {startMode === "lifetime"
                ? "Counts every point earned, including before this milestone."
                : "Counts points earned since this milestone started."}
            </p>
          </>
        ) : (
          <fieldset className={styles.choice}>
            <legend className={form.label}>Count from</legend>
            <label className={styles.radioRow}>
              <input
                type="radio"
                name="startMode"
                value="from_now"
                checked={startMode === "from_now"}
                onChange={() => setStartMode("from_now")}
                aria-label="From now on"
              />
              <span className={styles.radioLabel}>From now on</span>
              <span className={styles.radioHint}>
                Only points earned after you save count
              </span>
            </label>
            <label className={styles.radioRow}>
              <input
                type="radio"
                name="startMode"
                value="lifetime"
                checked={startMode === "lifetime"}
                onChange={() => setStartMode("lifetime")}
                aria-label="All points so far"
              />
              <span className={styles.radioLabel}>All points so far</span>
              <span className={styles.radioHint}>
                Every point they’ve ever earned counts
              </span>
            </label>
          </fieldset>
        )}
        <p className={styles.muted}>
          Spending points on rewards never lowers milestone progress.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Who&rsquo;s it for?</h2>
        <fieldset className={styles.choice}>
          <legend className="sr-only">Who&rsquo;s it for?</legend>
          <label className={styles.radioRow}>
            <input
              type="radio"
              name="who"
              value="all"
              checked={allKids}
              onChange={() => setAllKids(true)}
              aria-label="Every kid"
            />
            <span className={styles.radioLabel}>Every kid</span>
            <span className={styles.radioHint}>
              Including kids you add later
            </span>
          </label>
          <label className={styles.radioRow}>
            <input
              type="radio"
              name="who"
              value="some"
              checked={!allKids}
              onChange={() => setAllKids(false)}
              aria-label="Pick kids"
            />
            <span className={styles.radioLabel}>Pick kids</span>
            <span className={styles.radioHint}>Only the kids you tick</span>
          </label>
        </fieldset>

        {!allKids ? (
          <fieldset className={styles.kids}>
            <legend className={form.label}>Which kids?</legend>
            {kids.length === 0 ? (
              <p className={styles.muted}>Add kids first.</p>
            ) : (
              kids.map((k) => (
                <label key={k.id} className={styles.kidRow}>
                  <input
                    type="checkbox"
                    name="kidIds"
                    value={k.id}
                    checked={picked.has(k.id)}
                    onChange={(e) => toggle(k.id, e.target.checked)}
                    aria-label={k.name}
                  />
                  <span
                    className={styles.kidAvatar}
                    style={{ background: k.color }}
                  >
                    <IconByName name={k.avatar} size={18} />
                  </span>
                  <span className={own.kidName}>{k.name}</span>
                  <span className={own.kidMeta}>
                    {fmt(k.lifetime)} pts earned
                  </span>
                </label>
              ))
            )}
            {errors?.kidIds ? (
              <p role="alert" className={form.error}>
                {errors.kidIds}
              </p>
            ) : null}
          </fieldset>
        ) : null}

        {alreadyPast.length > 0 ? (
          <output className={own.pastNote}>
            {alreadyPast.map((k) => k.name).join(", ")}{" "}
            {alreadyPast.length === 1 ? "has" : "have"} already earned{" "}
            {fmt(targetNum)} points and will unlock it as soon as you save.
          </output>
        ) : null}
      </section>

      {state.error ? (
        <p role="alert" className={form.formError}>
          {state.error}
        </p>
      ) : null}

      <div className={styles.actions}>
        <Link href="/manage/milestones" className={styles.cancel}>
          Cancel
        </Link>
        <button type="submit" className={form.submit} disabled={pending}>
          {pending ? "Saving…" : "Save milestone"}
        </button>
      </div>
    </form>
  );
}
