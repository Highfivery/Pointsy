import type { Challenge, ChallengeGoal, ChallengeScope } from "@/lib/db/schema";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** "2026-06-24" → "Jun 24". */
export function formatDay(isoDate: string): string {
  const [, m, d] = isoDate.split("-").map(Number);
  return `${MONTHS[(m ?? 1) - 1]} ${d}`;
}

export function dateRange(startsOn: string, endsOn: string): string {
  return `${formatDay(startsOn)} – ${formatDay(endsOn)}`;
}

/** A short, human description of what the goal asks for. */
export function goalSummary(goalType: ChallengeGoal, target: number): string {
  if (goalType === "points") return `Earn ${target} points`;
  if (goalType === "chore_count") {
    return `Log ${target} ${target === 1 ? "chore" : "chores"}`;
  }
  return `All core chores, ${target} ${target === 1 ? "day" : "days"}`;
}

export function scopeLabel(scope: ChallengeScope): string {
  return scope === "family" ? "Whole family" : "Each kid";
}

export type ChallengeStatus = "active" | "upcoming" | "ended" | "paused";

export function challengeStatus(
  challenge: Pick<Challenge, "isActive" | "startsOn" | "endsOn">,
  today: string,
): ChallengeStatus {
  if (!challenge.isActive) return "paused";
  if (today < challenge.startsOn) return "upcoming";
  if (today > challenge.endsOn) return "ended";
  return "active";
}
