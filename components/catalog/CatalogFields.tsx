"use client";

import { Field } from "@/components/auth/Field";
import { IconPicker } from "@/components/icons/IconPicker";
import {
  CHORE_ICON_KEYS,
  REWARD_ICON_KEYS,
  DEFAULT_CHORE_ICON,
  DEFAULT_REWARD_ICON,
} from "@/lib/icons";

export type CatalogKind = "chore" | "reward";

interface CatalogFieldsProps {
  kind: CatalogKind;
  errors?: Record<string, string>;
  defaults?: {
    name?: string;
    emoji?: string;
    value?: number;
    description?: string | null;
  };
}

/** Shared form fields for creating/editing a chore or reward. */
export function CatalogFields({ kind, errors, defaults }: CatalogFieldsProps) {
  const isChore = kind === "chore";
  const valueName = isChore ? "points" : "cost";
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
      {!isChore ? (
        <Field
          label="Description (optional)"
          name="description"
          defaultValue={defaults?.description ?? ""}
          autoComplete="off"
          maxLength={280}
          error={errors?.description}
        />
      ) : null}
    </>
  );
}
