"use client";

import { useActionState, useEffect, useRef } from "react";
import { createCatalogItemAction } from "@/app/actions/catalog";
import { CatalogFields, type CatalogKind } from "./CatalogFields";
import type { FormState } from "@/lib/validation/form";
import form from "@/components/auth/auth-form.module.css";
import styles from "@/components/manage/manage.module.css";

const initialState: FormState = {};

export function AddCatalogForm({ kind }: { kind: CatalogKind }) {
  const [state, action, pending] = useActionState(
    createCatalogItemAction,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <section className={styles.card} aria-labelledby="add-item-title">
      <h2 id="add-item-title" className={styles.cardTitle}>
        {kind === "chore" ? "Add a chore" : "Add a reward"}
      </h2>
      <form ref={formRef} action={action} className={form.form} noValidate>
        <input type="hidden" name="kind" value={kind} />
        <CatalogFields kind={kind} errors={state.fieldErrors} />
        {state.error ? (
          <p role="alert" className={form.formError}>
            {state.error}
          </p>
        ) : null}
        <button type="submit" className={form.submit} disabled={pending}>
          {pending ? "Adding…" : kind === "chore" ? "Add chore" : "Add reward"}
        </button>
      </form>
    </section>
  );
}
