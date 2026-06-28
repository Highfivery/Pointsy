"use client";

import { useId, useState } from "react";
import { Field } from "@/components/auth/Field";
import { IconPicker } from "@/components/icons/IconPicker";
import {
  CHORE_ICON_KEYS,
  REWARD_ICON_KEYS,
  DEFAULT_CHORE_ICON,
  DEFAULT_REWARD_ICON,
} from "@/lib/icons";
import type { LimitPeriod } from "@/lib/catalog/limit";
import form from "@/components/auth/auth-form.module.css";
import styles from "./catalog.module.css";

export type CatalogKind = "chore" | "reward";
export type { LimitPeriod };

interface CatalogFieldsProps {
  kind: CatalogKind;
  errors?: Record<string, string>;
  /** Kids in the family — enables the "just for one kid" reward option. */
  kids?: { id: string; name: string }[];
  defaults?: {
    name?: string;
    emoji?: string;
    value?: number;
    description?: string | null;
    limitPeriod?: LimitPeriod;
    limitCount?: number;
    isTeam?: boolean;
    minKids?: number;
    allowSolo?: boolean;
    assignedToKidId?: string | null;
  };
}

/** Shared form fields for creating/editing a chore or reward. */
export function CatalogFields({
  kind,
  errors,
  kids,
  defaults,
}: CatalogFieldsProps) {
  const isChore = kind === "chore";
  const valueName = isChore ? "points" : "cost";
  // Unique per instance — the add form and every edit card render these fields,
  // so static ids would collide and mis-wire the labels (issue #56).
  const periodId = useId();
  const forKidId = useId();
  const [period, setPeriod] = useState<LimitPeriod>(
    defaults?.limitPeriod ?? "none",
  );
  const [isTeam, setIsTeam] = useState<boolean>(defaults?.isTeam ?? false);
  const [allowSolo, setAllowSolo] = useState<boolean>(
    defaults?.allowSolo ?? false,
  );

  return (
    <>
      <Field
        label="Name"
        name="name"
        defaultValue={defaults?.name}
        autoComplete="off"
        error={errors?.name}
        required
      />
      <IconPicker
        name="emoji"
        label="Icon"
        options={isChore ? CHORE_ICON_KEYS : REWARD_ICON_KEYS}
        defaultValue={
          defaults?.emoji ??
          (isChore ? DEFAULT_CHORE_ICON : DEFAULT_REWARD_ICON)
        }
      />
      <Field
        label={isChore ? "Points" : "Cost (points)"}
        name={valueName}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        defaultValue={defaults?.value ?? (isChore ? 5 : 10)}
        error={errors?.points ?? errors?.cost}
        required
      />

      {isChore ? (
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
                autoComplete="off"
                defaultValue={defaults?.limitCount ?? 1}
                error={errors?.limitCount}
                required
              />
            </div>
          )}
        </div>
      ) : null}

      {!isChore && kids && kids.length > 0 ? (
        <div className={form.field}>
          <label htmlFor={forKidId} className={form.label}>
            Who&rsquo;s it for?
          </label>
          <select
            id={forKidId}
            name="assignedToKidId"
            defaultValue={defaults?.assignedToKidId ?? ""}
            className={styles.select}
          >
            <option value="">Everyone</option>
            {kids.map((k) => (
              <option key={k.id} value={k.id}>
                Just for {k.name}
              </option>
            ))}
          </select>
          <p className={form.hint}>
            Pick a kid to make it their personal goal — only they see it, with a
            progress tracker on their dashboard.
          </p>
        </div>
      ) : null}

      {!isChore ? (
        <div className={form.field}>
          <label className={styles.teamRow}>
            <input
              type="checkbox"
              name="isTeam"
              checked={isTeam}
              onChange={(e) => setIsTeam(e.target.checked)}
              aria-label="Team reward"
            />
            <span>
              <span className={styles.teamLabel}>Team reward</span>
              <span className={styles.teamHint}>
                Kids team up and chip in together
              </span>
            </span>
          </label>
          {isTeam ? (
            <>
              <Field
                label="Minimum kids"
                name="minKids"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                defaultValue={defaults?.minKids ?? 2}
                error={errors?.minKids}
              />
              <label className={styles.teamRow}>
                <input
                  type="checkbox"
                  name="allowSolo"
                  checked={allowSolo}
                  onChange={(e) => setAllowSolo(e.target.checked)}
                  aria-label="Also redeemable solo"
                />
                <span>
                  <span className={styles.teamLabel}>Also redeemable solo</span>
                  <span className={styles.teamHint}>
                    A kid can also grab it alone at the full price
                  </span>
                </span>
              </label>
            </>
          ) : (
            <input
              type="hidden"
              name="minKids"
              value={defaults?.minKids ?? 2}
            />
          )}
        </div>
      ) : null}

      <Field
        label="Description (optional)"
        name="description"
        defaultValue={defaults?.description ?? ""}
        autoComplete="off"
        maxLength={280}
        error={errors?.description}
      />
    </>
  );
}
