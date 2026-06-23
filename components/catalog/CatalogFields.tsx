"use client";

import { Field } from "@/components/auth/Field";

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
      <Field
        label="Emoji"
        name="emoji"
        defaultValue={defaults?.emoji ?? (isChore ? "✅" : "🎁")}
        autoComplete="off"
        maxLength={8}
        error={errors?.emoji}
        required
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
