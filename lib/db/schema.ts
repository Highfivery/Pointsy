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
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ enums */

export const roleEnum = pgEnum("role", ["parent", "kid"]);
export const ledgerTypeEnum = pgEnum("ledger_type", [
  "earn",
  "redeem",
  "adjust",
]);
export const redemptionStatusEnum = pgEnum("redemption_status", [
  "requested",
  "approved",
  "fulfilled",
  "denied",
  "cancelled",
]);

/* --------------------------------------------------------------- families */

export const families = pgTable("families", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  /** Short, human-friendly join/login code, e.g. "MARSH-7Q2". */
  code: text("code").notNull().unique(),
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
    /** Emoji or preset avatar key. */
    avatar: text("avatar").notNull().default("🙂"),
    /** Theme accent (hex or preset key). */
    color: text("color").notNull().default("#6366f1"),
    /** Parents only. Stored lower-cased; unique across the whole app. */
    email: text("email"),
    /** Parents only (argon2id). */
    passwordHash: text("password_hash"),
    /** Kids (and optionally parents) — 4-digit PIN, argon2id. */
    pinHash: text("pin_hash"),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
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
    /** Default award value (overridable at award time). */
    points: integer("points").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("chores_family_idx").on(t.familyId)],
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

/* ------------------------------------------------------------------ types */

export type Family = typeof families.$inferSelect;
export type NewFamily = typeof families.$inferInsert;
export type Person = typeof people.$inferSelect;
export type NewPerson = typeof people.$inferInsert;
export type Chore = typeof chores.$inferSelect;
export type NewChore = typeof chores.$inferInsert;
export type Reward = typeof rewards.$inferSelect;
export type NewReward = typeof rewards.$inferInsert;
export type Redemption = typeof redemptions.$inferSelect;
export type NewRedemption = typeof redemptions.$inferInsert;
export type LedgerEntry = typeof ledger.$inferSelect;
export type NewLedgerEntry = typeof ledger.$inferInsert;

export const schema = {
  families,
  people,
  chores,
  rewards,
  redemptions,
  ledger,
  roleEnum,
  ledgerTypeEnum,
  redemptionStatusEnum,
};
