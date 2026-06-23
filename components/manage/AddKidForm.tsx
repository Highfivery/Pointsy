"use client";

import { useActionState, useEffect, useRef } from "react";
import { addKidAction } from "@/app/actions/people";
import { Field } from "@/components/auth/Field";
import { IconPicker } from "@/components/icons/IconPicker";
import { AVATAR_ICON_KEYS, DEFAULT_AVATAR_ICON } from "@/lib/icons";
import type { FormState } from "@/lib/validation/form";
import { COLOR_OPTIONS, DEFAULT_COLOR } from "./options";
import form from "@/components/auth/auth-form.module.css";
import styles from "./manage.module.css";

const initialState: FormState = {};

export function AddKidForm() {
  const [state, action, pending] = useActionState(addKidAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <section className={styles.card} aria-labelledby="add-kid-title">
      <h2 id="add-kid-title" className={styles.cardTitle}>
        Add a child
      </h2>
      <form ref={formRef} action={action} className={form.form} noValidate>
        <Field
          label="Name"
          name="name"
          autoComplete="off"
          error={state.fieldErrors?.name}
          required
        />
        <IconPicker
          name="avatar"
          label="Avatar"
          options={AVATAR_ICON_KEYS}
          defaultValue={DEFAULT_AVATAR_ICON}
        />

        <div className={form.field}>
          <label htmlFor="add-kid-color" className={form.label}>
            Color
          </label>
          <select
            id="add-kid-color"
            name="color"
            defaultValue={DEFAULT_COLOR}
            className={styles.select}
          >
            {COLOR_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <Field
          label="4-digit PIN"
          name="pin"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={4}
          hint="Your child uses this to sign in."
          error={state.fieldErrors?.pin}
          required
        />

        {state.error ? (
          <p role="alert" className={form.formError}>
            {state.error}
          </p>
        ) : null}

        <button type="submit" className={form.submit} disabled={pending}>
          {pending ? "Adding…" : "Add child"}
        </button>
      </form>
    </section>
  );
}
