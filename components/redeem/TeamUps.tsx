import { Users } from "lucide-react";
import { IconByName } from "@/components/icons/registry";
import { respondTeamAction, cancelTeamAction } from "@/app/actions/team";
import type { TeamRedemptionView } from "@/lib/redemptions/team";
import styles from "./team-list.module.css";

function statusLabel(t: TeamRedemptionView): string {
  if (t.status === "approved") return "Approved! 🎉";
  return t.members.every((m) => m.status === "accepted")
    ? "Waiting for a grown-up"
    : "Waiting for teammates";
}

/** A kid's team-up invites (to answer) and the team-ups they're already in. */
export function TeamUps({
  kidId,
  invites,
  mine,
}: {
  kidId: string;
  invites: TeamRedemptionView[];
  mine: TeamRedemptionView[];
}) {
  // "mine" overlaps invites — only show ones the kid has actually committed to.
  const committed = mine.filter(
    (t) => t.members.find((m) => m.personId === kidId)?.status === "accepted",
  );
  if (invites.length === 0 && committed.length === 0) return null;

  return (
    <section aria-labelledby="teamups-title" className={styles.wrap}>
      <h2 id="teamups-title" className={styles.heading}>
        <Users size={20} aria-hidden="true" />
        Team-ups
      </h2>

      {invites.map((t) => {
        const proposer = t.members.find((m) => m.personId === t.proposedBy);
        const myShare = t.members.find((m) => m.personId === kidId)?.share ?? 0;
        return (
          <div key={t.id} className={styles.invite}>
            <p className={styles.inviteText}>
              <strong>{proposer?.name ?? "A teammate"}</strong> wants to team up
              for <strong>{t.rewardName}</strong>.
            </p>
            <p className={styles.share}>Your share: {myShare} points</p>
            <form action={respondTeamAction} className={styles.respond}>
              <input type="hidden" name="teamRedemptionId" value={t.id} />
              <button
                type="submit"
                name="accept"
                value="true"
                className={styles.yes}
              >
                I&rsquo;m in!
              </button>
              <button
                type="submit"
                name="accept"
                value="false"
                className={styles.no}
              >
                No thanks
              </button>
            </form>
          </div>
        );
      })}

      {committed.map((t) => (
        <div key={t.id} className={styles.row}>
          <span className={styles.rowText}>
            <span className={styles.rowName}>{t.rewardName}</span>
            <span className={styles.rowStatus}>{statusLabel(t)}</span>
          </span>
          <span className={styles.avatars}>
            {t.members.map((m) => (
              <span
                key={m.personId}
                className={styles.avatar}
                style={{ background: m.color }}
                data-out={m.status === "declined"}
                title={`${m.name} · ${m.share} pts`}
              >
                <IconByName name={m.avatar} size={16} />
              </span>
            ))}
          </span>
          {t.status === "proposed" && t.proposedBy === kidId ? (
            <form action={cancelTeamAction}>
              <input type="hidden" name="teamRedemptionId" value={t.id} />
              <button type="submit" className={styles.cancel}>
                Cancel
              </button>
            </form>
          ) : null}
        </div>
      ))}
    </section>
  );
}
