"use client";

import { useActionState, useState } from "react";
import { Trash2 } from "lucide-react";
import { Field } from "@/components/auth/Field";
import type { FormState } from "@/lib/validation/form";
import form from "@/components/auth/auth-form.module.css";
import styles from "./danger.module.css";

/**
 * A destructive action gated by typing an exact word (a child's name, the
 * family name). The button stays disabled until the text matches, and the
 * server re-checks the confirmation too.
 */
export function DangerDeleteForm({
  action,
  confirmWord,
  buttonLabel,
  intro,
  hidden = [],
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  confirmWord: string;
  buttonLabel: string;
  intro: string;
  hidden?: { name: string; value: string }[];
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [value, setValue] = useState("");
  const matches = value.trim() === confirmWord;

  return (
    <form
      action={formAction}
      className={`${form.form} ${styles.form}`}
      noValidate
    >
      {hidden.map((h) => (
        <input key={h.name} type="hidden" name={h.name} value={h.value} />
      ))}
      <p className={styles.warn}>{intro}</p>
      <Field
        label={`Type “${confirmWord}” to confirm`}
        name="confirm"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        error={state.fieldErrors?.confirm}
        autoComplete="off"
      />
      <button
        type="submit"
        className={styles.deleteBtn}
        disabled={!matches || pending}
      >
        <Trash2 size={16} aria-hidden="true" />
        {pending ? "Deleting…" : buttonLabel}
      </button>
      {state.error ? <p className={form.formError}>{state.error}</p> : null}
    </form>
  );
}
