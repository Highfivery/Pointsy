"use client";

import { useActionState, useState } from "react";
import { UserPlus, Copy, Check } from "lucide-react";
import {
  createParentInviteAction,
  type InviteState,
} from "@/app/actions/parents";
import styles from "./parents.module.css";

const initial: InviteState = {};

export function InviteParent() {
  const [state, action, pending] = useActionState(
    createParentInviteAction,
    initial,
  );
  const [copied, setCopied] = useState(false);

  function copy(code: string) {
    void navigator.clipboard?.writeText(code);
    setCopied(true);
  }

  return (
    <div className={styles.invite}>
      <form action={action}>
        <button type="submit" className={styles.inviteBtn} disabled={pending}>
          <UserPlus size={18} aria-hidden="true" />
          {pending ? "Creating…" : "Invite a parent"}
        </button>
      </form>

      {state.code ? (
        <output className={styles.codeBox}>
          <p className={styles.codeLabel}>
            Share this code with the other parent. It works once and expires in
            72 hours — Pointsy never emails it.
          </p>
          <div className={styles.codeRow}>
            <span className={styles.code}>{state.code}</span>
            <button
              type="button"
              onClick={() => copy(state.code as string)}
              className={styles.copyBtn}
            >
              {copied ? (
                <Check size={16} aria-hidden="true" />
              ) : (
                <Copy size={16} aria-hidden="true" />
              )}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className={styles.codeHint}>
            They enter it at <a href="/join">the join page</a> to create their
            own login.
          </p>
        </output>
      ) : null}
    </div>
  );
}
