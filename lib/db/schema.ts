/**
 * Pointsy database schema (Postgres via Drizzle).
 *
 * Design invariants (see SPEC §4):
 *  - Every domain row carries `familyId` for strict multi-tenant isolation.
 *  - The `ledger` is append-only and is the single source of truth for points.
 *    A person's balance is derived: SUM(ledger.amount). Corrections are new
 *    `adjust` rows — ledger rows are never updated or deleted.
 *  - Points are integers and may be negative (balances are not floored).
 */
import {
  pgEnum,
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  index,
  uniqueIndex,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ enums */

export const roleEnum = pgEnum("role", ["parent", "kid"]);
export const ledgerTypeEnum = pgEnum("ledger_type", [
  "earn",
  "redeem",
  "adjust",
  "bonus",
]);
export const redemptionStatusEnum = pgEnum("redemption_status", [
  "requested",
  "approved",
  "fulfilled",
  "denied",
  "cancelled",
]);
/** How often a kid may claim a chore. "none" = unlimited. */
export const choreLimitPeriodEnum = pgEnum("chore_limit_period", [
  "none",
  "day",
  "week",
]);
export const submissionStatusEnum = pgEnum("submission_status", [
  "pending",
  "approved",
  "rejected",
  "cancelled",
]);
/** Area a chore belongs to, used to group chores across every view. */
export const choreCategoryEnum = pgEnum("chore_category", [
  "bedroom",
  "bathroom",
  "kitchen",
  "home",
  "outdoor",
  "pets",
  "school",
  "selfcare",
  "other",
]);
/** Who a chore is for. "rotating" takes turns among its assignees. */
export const choreAssignmentEnum = pgEnum("chore_assignment", [
  "everyone",
  "specific",
  "rotating",
]);

/** Whether a challenge is tracked per kid or as one shared family goal. */
export const challengeScopeEnum = pgEnum("challenge_scope", ["kid", "family"]);

/** What a challenge measures: points earned, chores logged, or core-chore days. */
export const challengeGoalEnum = pgEnum("challenge_goal", [
  "points",
  "chore_count",
  "core_days",
]);

/* --------------------------------------------------------------- families */

export const families = pgTable("families", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  /** Short, human-friendly join/login code, e.g. "MARSH-7Q2". */
  code: text("code").notNull().unique(),
  /** The creating parent — protected: can't be removed, and only they may
      remove other parents. Set just after the first parent is created.
      `AnyPgColumn` annotation breaks the families↔people circular inference. */
  ownerId: uuid("owner_id").references((): AnyPgColumn => people.id, {
    onDelete: "set null",
  }),
  /** IANA timezone (e.g. "America/New_York"); defines the family's day for
      chore limits. Auto-detected from the browser. */
  timezone: text("timezone").notNull().default("UTC"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/* ----------------------------------------------------------------- people */

export const people = pgTable(
  "people",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    role: roleEnum("role").notNull(),
    name: text("name").notNull(),
    /** Preset avatar icon key (see lib/icons). */
    avatar: text("avatar").notNull().default("smile"),
    /** Theme accent (hex or preset key). */
    color: text("color").notNull().default("#6366f1"),
    /** Parents only. Stored lower-cased; unique across the whole app. */
    email: text("email"),
    /** Parents only (argon2id). */
    passwordHash: text("password_hash"),
    /** Kids (and optionally parents) — 4-digit PIN, argon2id. */
    pinHash: text("pin_hash"),
    /** Failed PIN attempts since the last success (drives lockout). */
    pinFailedAttempts: integer("pin_failed_attempts").notNull().default(0),
    /** When set and in the future, PIN sign-in is locked until this time. */
    pinLockedUntil: timestamp("pin_locked_until", { withTimezone: true }),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    /** Kids only — the reward they're saving toward (drives the goal ring). */
    goalRewardId: uuid("goal_reward_id").references(
      (): AnyPgColumn => rewards.id,
      { onDelete: "set null" },
    ),
    /** Parents only — when guardian consent was recorded. */
    consentAt: timestamp("consent_at", { withTimezone: true }),
    /** Parents only — ToS/Privacy version consented to. */
    consentVersion: text("consent_version"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("people_family_idx").on(t.familyId),
    uniqueIndex("people_email_unique").on(t.email),
  ],
);

/* ------------------------------------------------- chores (behavior catalog) */

export const chores = pgTable(
  "chores",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    emoji: text("emoji").notNull().default("✅"),
    /** Optional short description shown to kids. */
    description: text("description"),
    /** Default award value (overridable at award time). */
    points: integer("points").notNull(),
    /** Area used to group chores in every view. */
    category: choreCategoryEnum("category").notNull().default("other"),
    /** Favourited chores surface first on the award screen. */
    pinned: boolean("pinned").notNull().default(false),
    /** A "core" chore that's expected daily (drives challenges). */
    isCore: boolean("is_core").notNull().default(false),
    /** Who the chore is for. Assignees live in `choreAssignees`. */
    assignment: choreAssignmentEnum("assignment").notNull().default("everyone"),
    /** For "rotating": whose turn it is now. Advances when they complete it. */
    currentTurnPersonId: uuid("current_turn_person_id").references(
      (): AnyPgColumn => people.id,
      { onDelete: "set null" },
    ),
    /** Per-kid claim limit when a kid submits this chore. "none" = unlimited. */
    limitPeriod: choreLimitPeriodEnum("limit_period").notNull().default("none"),
    limitCount: integer("limit_count").notNull().default(1),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("chores_family_idx").on(t.familyId)],
);

/**
 * The kids a chore is assigned to (for "specific") or the rotation order (for
 * "rotating", by `position`). Empty for "everyone".
 */
export const choreAssignees = pgTable(
  "chore_assignees",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    choreId: uuid("chore_id")
      .notNull()
      .references(() => chores.id, { onDelete: "cascade" }),
    personId: uuid("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
  },
  (t) => [
    index("chore_assignees_chore_idx").on(t.choreId),
    uniqueIndex("chore_assignees_unique").on(t.choreId, t.personId),
  ],
);

/** An ordered checklist on a chore; a kid must tick all of them to log it. */
export const choreSubtasks = pgTable(
  "chore_subtasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    choreId: uuid("chore_id")
      .notNull()
      .references(() => chores.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    position: integer("position").notNull().default(0),
  },
  (t) => [index("chore_subtasks_chore_idx").on(t.choreId)],
);

/* ---------------------------------------------------------------- rewards */

export const rewards = pgTable(
  "rewards",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    emoji: text("emoji").notNull().default("🎁"),
    /** Points required to redeem. */
    cost: integer("cost").notNull(),
    description: text("description"),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("rewards_family_idx").on(t.familyId)],
);

/* ------------------------------------------------------------ redemptions */

export const redemptions = pgTable(
  "redemptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    personId: uuid("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    rewardId: uuid("reward_id").references(() => rewards.id, {
      onDelete: "set null",
    }),
    /** Snapshot — rewards may be edited/removed after a request. */
    rewardName: text("reward_name").notNull(),
    cost: integer("cost").notNull(),
    status: redemptionStatusEnum("status").notNull().default("requested"),
    requestedAt: timestamp("requested_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    decidedBy: uuid("decided_by").references(() => people.id, {
      onDelete: "set null",
    }),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    fulfilledBy: uuid("fulfilled_by").references(() => people.id, {
      onDelete: "set null",
    }),
    fulfilledAt: timestamp("fulfilled_at", { withTimezone: true }),
    note: text("note"),
  },
  (t) => [
    index("redemptions_family_idx").on(t.familyId),
    index("redemptions_person_idx").on(t.personId),
    index("redemptions_status_idx").on(t.status),
  ],
);

/* ----------------------------------------- ledger (append-only, source of truth) */

export const ledger = pgTable(
  "ledger",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    /** The kid this entry belongs to. */
    personId: uuid("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    /** Signed: + earn, − redeem, ± adjust. */
    amount: integer("amount").notNull(),
    type: ledgerTypeEnum("type").notNull(),
    reason: text("reason").notNull(),
    choreId: uuid("chore_id").references(() => chores.id, {
      onDelete: "set null",
    }),
    rewardId: uuid("reward_id").references(() => rewards.id, {
      onDelete: "set null",
    }),
    redemptionId: uuid("redemption_id").references(() => redemptions.id, {
      onDelete: "set null",
    }),
    /** The parent who awarded/approved this entry. */
    createdBy: uuid("created_by").references(() => people.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("ledger_family_idx").on(t.familyId),
    index("ledger_person_idx").on(t.personId),
  ],
);

/* ------------------------------------------------- push subscriptions */

export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    personId: uuid("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    /** Web Push subscription fields. */
    endpoint: text("endpoint").notNull().unique(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("push_subs_family_idx").on(t.familyId),
    index("push_subs_person_idx").on(t.personId),
  ],
);

/* ----------------------------------------------------- parent invites */

export const parentInvites = pgTable(
  "parent_invites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    /** SHA-256 of the normalised invite code; the code itself is shown once. */
    codeHash: text("code_hash").notNull().unique(),
    createdBy: uuid("created_by").references(() => people.id, {
      onDelete: "set null",
    }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    redeemedAt: timestamp("redeemed_at", { withTimezone: true }),
    redeemedBy: uuid("redeemed_by").references(() => people.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("parent_invites_family_idx").on(t.familyId)],
);

/* -------------------------------------------------- chore submissions */

export const choreSubmissions = pgTable(
  "chore_submissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    /** The kid who logged the chore. */
    personId: uuid("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    choreId: uuid("chore_id").references(() => chores.id, {
      onDelete: "set null",
    }),
    /** Snapshot at submit time — catalog edits don't change a pending claim. */
    choreName: text("chore_name").notNull(),
    points: integer("points").notNull(),
    status: submissionStatusEnum("status").notNull().default("pending"),
    /** Family-local date ("YYYY-MM-DD") for daily/weekly limit counting. */
    localDate: text("local_date").notNull(),
    decidedBy: uuid("decided_by").references(() => people.id, {
      onDelete: "set null",
    }),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("chore_submissions_family_idx").on(t.familyId),
    index("chore_submissions_person_idx").on(t.personId),
  ],
);

/* -------------------------------------------------------------- challenges */

/**
 * A time-boxed goal a parent sets. `scope` decides whether each kid is tracked
 * on their own ("kid") or all participants share one tally ("family"). The bonus
 * is awarded once per kid when the goal is met (family goals award every
 * participating kid the full bonus). Dates are family-local "YYYY-MM-DD".
 */
export const challenges = pgTable(
  "challenges",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    scope: challengeScopeEnum("scope").notNull().default("kid"),
    goalType: challengeGoalEnum("goal_type").notNull(),
    /** Target count for the goal (points, chores, or days). */
    goalTarget: integer("goal_target").notNull(),
    /** Points awarded to each completing kid. */
    bonusPoints: integer("bonus_points").notNull(),
    startsOn: text("starts_on").notNull(),
    endsOn: text("ends_on").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdBy: uuid("created_by").references(() => people.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("challenges_family_idx").on(t.familyId)],
);

/** Which kids a challenge applies to. No rows ⇒ every kid in the family. */
export const challengeParticipants = pgTable(
  "challenge_participants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    challengeId: uuid("challenge_id")
      .notNull()
      .references(() => challenges.id, { onDelete: "cascade" }),
    personId: uuid("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
  },
  (t) => [
    index("challenge_participants_challenge_idx").on(t.challengeId),
    uniqueIndex("challenge_participants_unique").on(t.challengeId, t.personId),
  ],
);

/** Records the one-time bonus award so a kid is never paid twice for a goal. */
export const challengeAwards = pgTable(
  "challenge_awards",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    challengeId: uuid("challenge_id")
      .notNull()
      .references(() => challenges.id, { onDelete: "cascade" }),
    personId: uuid("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    awardedAt: timestamp("awarded_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("challenge_awards_challenge_idx").on(t.challengeId),
    uniqueIndex("challenge_awards_unique").on(t.challengeId, t.personId),
  ],
);

/* ------------------------------------------------------------------ types */

export type Family = typeof families.$inferSelect;
export type NewFamily = typeof families.$inferInsert;
export type Person = typeof people.$inferSelect;
export type NewPerson = typeof people.$inferInsert;
export type Chore = typeof chores.$inferSelect;
export type NewChore = typeof chores.$inferInsert;
export type ChoreCategory = (typeof choreCategoryEnum.enumValues)[number];
export type ChoreAssignment = (typeof choreAssignmentEnum.enumValues)[number];
export type ChoreSubtask = typeof choreSubtasks.$inferSelect;
export type NewChoreSubtask = typeof choreSubtasks.$inferInsert;
export type ChoreAssignee = typeof choreAssignees.$inferSelect;
export type NewChoreAssignee = typeof choreAssignees.$inferInsert;
export type Reward = typeof rewards.$inferSelect;
export type NewReward = typeof rewards.$inferInsert;
export type Redemption = typeof redemptions.$inferSelect;
export type NewRedemption = typeof redemptions.$inferInsert;
export type LedgerEntry = typeof ledger.$inferSelect;
export type NewLedgerEntry = typeof ledger.$inferInsert;
export type PushSubscriptionRow = typeof pushSubscriptions.$inferSelect;
export type NewPushSubscriptionRow = typeof pushSubscriptions.$inferInsert;
export type ParentInvite = typeof parentInvites.$inferSelect;
export type NewParentInvite = typeof parentInvites.$inferInsert;
export type ChoreSubmission = typeof choreSubmissions.$inferSelect;
export type NewChoreSubmission = typeof choreSubmissions.$inferInsert;
export type Challenge = typeof challenges.$inferSelect;
export type NewChallenge = typeof challenges.$inferInsert;
export type ChallengeScope = (typeof challengeScopeEnum.enumValues)[number];
export type ChallengeGoal = (typeof challengeGoalEnum.enumValues)[number];
export type ChallengeParticipant = typeof challengeParticipants.$inferSelect;
export type ChallengeAward = typeof challengeAwards.$inferSelect;

export const schema = {
  families,
  people,
  chores,
  choreAssignees,
  choreSubtasks,
  rewards,
  redemptions,
  ledger,
  pushSubscriptions,
  parentInvites,
  choreSubmissions,
  challenges,
  challengeParticipants,
  challengeAwards,
  roleEnum,
  ledgerTypeEnum,
  redemptionStatusEnum,
  choreLimitPeriodEnum,
  submissionStatusEnum,
  choreCategoryEnum,
  choreAssignmentEnum,
  challengeScopeEnum,
  challengeGoalEnum,
};
