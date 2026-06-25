"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { IconByName } from "@/components/icons/registry";
import { proposeTeamAction } from "@/app/actions/team";
import { evenShares } from "@/lib/redemptions/split";
import type { FormState } from "@/lib/validation/form";
import styles from "./team-up.module.css";

export interface TeamKid {
  id: string;
  name: string;
  avatar: string;
  color: string;
}

const initialState: FormState = {};

/**
 * Lets a kid propose a team reward: pick teammates, see their own even share
 * update live, and send invites. The proposer is always included.
 */
export function TeamUpButton({
  reward,
  otherKids,
  className,
  children,
}: {
  reward: { id: string; name: string; cost: number; minKids: number };
  otherKids: TeamKid[];
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [state, action, pending] = useActionState(
    proposeTeamAction,
    initialState,
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (state.ok) ref.current?.close();
  }, [state.ok]);

  const total = selected.size + 1; // + the proposer
  const myShare = evenShares(reward.cost, total)[0] ?? reward.cost;
  const enough = total >= reward.minKids;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => requestAnimationFrame(() => ref.current?.showModal())}
      >
        {children}
      </button>

      <dialog
        ref={ref}
        className={styles.sheet}
        aria-label={`Team up for ${reward.name}`}
      >
        <p className={styles.title}>Team up for {reward.name}</p>
        <p className={styles.cost}>{reward.cost} points, split evenly</p>

        <form action={action} className={styles.form}>
          <input type="hidden" name="rewardId" value={reward.id} />
          <fieldset className={styles.kids}>
            <legend className={styles.legend}>Who&rsquo;s teaming up?</legend>
            {otherKids.length === 0 ? (
              <p className={styles.muted}>No one else to team up with yet.</p>
            ) : (
              otherKids.map((k) => (
                <label key={k.id} className={styles.kidRow}>
                  <input
                    type="checkbox"
                    name="kidIds"
                    value={k.id}
                    checked={selected.has(k.id)}
                    onChange={() => toggle(k.id)}
                    aria-label={k.name}
                  />
                  <span
                    className={styles.kidAvatar}
                    style={{ background: k.color }}
                  >
                    <IconByName name={k.avatar} size={18} />
                  </span>
                  <span>{k.name}</span>
                </label>
              ))
            )}
          </fieldset>

          <p className={styles.share}>
            {enough
              ? `${total} kids · your share is ${myShare} points`
              : `Pick at least ${reward.minKids} kids in total`}
          </p>
          {state.error ? (
            <p className={styles.error} role="alert">
              {state.error}
            </p>
          ) : null}
          <button
            type="submit"
            className={styles.propose}
            disabled={pending || !enough}
          >
            {pending ? "Sending…" : "Send team-up invites"}
          </button>
        </form>

        <button
          type="button"
          className={styles.cancel}
          onClick={() => ref.current?.close()}
        >
          Not now
        </button>
      </dialog>
    </>
  );
}
