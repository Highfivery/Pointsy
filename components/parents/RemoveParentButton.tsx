"use client";

import { useActionState } from "react";
import { UserMinus } from "lucide-react";
import { removeParentAction } from "@/app/actions/parents";
import styles from "./parents.module.css";

export function RemoveParentButton({
  parentId,
  name,
}: {
  parentId: string;
  name: string;
}) {
  const [state, action, pending] = useActionState(removeParentAction, {});

  return (
    <form action={action} className={styles.removeForm}>
      <input type="hidden" name="parentId" value={parentId} />
      <button
        type="submit"
        className={styles.remove}
        disabled={pending}
        aria-label={`Remove ${name}`}
      >
        <UserMinus size={16} aria-hidden="true" />
        {pending ? "Removing…" : "Remove"}
      </button>
      {state.error ? (
        <span role="alert" className={styles.removeError}>
          {state.error}
        </span>
      ) : null}
    </form>
  );
}
