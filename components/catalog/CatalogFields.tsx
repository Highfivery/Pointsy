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
import { CHORE_CATEGORIES } from "@/lib/catalog/category";
import form from "@/components/auth/auth-form.module.css";
import styles from "./catalog.module.css";

export type CatalogKind = "chore" | "reward";
export type { LimitPeriod };

interface CatalogFieldsProps {
  kind: CatalogKind;
  errors?: Record<string, string>;
  defaults?: {
    name?: string;
    emoji?: string;
    value?: number;
    description?: string | null;
    category?: string;
    limitPeriod?: LimitPeriod;
    limitCount?: number;
  };
}

/** Shared form fields for creating/editing a chore or reward. */
export function CatalogFields({ kind, errors, defaults }: CatalogFieldsProps) {
  const isChore = kind === "chore";
  const valueName = isChore ? "points" : "cost";
  // Unique per instance — the add form and every edit card render these fields,
  // so static ids would collide and mis-wire the labels (issue #56).
  const categoryId = useId();
  const periodId = useId();
  const [period, setPeriod] = useState<LimitPeriod>(
    defaults?.limitPeriod ?? "none",
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
          <label htmlFor={categoryId} className={form.label}>
            Category
          </label>
          <select
            id={categoryId}
            name="category"
            defaultValue={defaults?.category ?? "other"}
            className={styles.select}
          >
            {CHORE_CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}

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
