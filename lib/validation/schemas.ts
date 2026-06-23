import { z } from "zod";
import { isIconKey } from "@/lib/icons";

/**
 * Zod schemas validate every server-action boundary (SPEC §3 security
 * invariants). Keep messages kid/parent-friendly — they may surface in UI.
 */

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address.");

export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(200);

export const pinSchema = z
  .string()
  .regex(/^\d{4}$/, "PIN must be exactly 4 digits.");

export const personNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required.")
  .max(40);

export const emojiSchema = z.string().trim().min(1).max(8);
export const iconSchema = z.string().refine(isIconKey, "Pick an icon.");
export const colorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Use a hex color like #6366f1.");

/* ----------------------------------------------------------------- auth */

export const signUpSchema = z.object({
  familyName: z.string().trim().min(1, "Family name is required.").max(60),
  parentName: personNameSchema,
  email: emailSchema,
  password: passwordSchema,
  consent: z
    .boolean()
    .refine((v) => v === true, "Parental consent is required to continue."),
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
});

export const inviteCodeSchema = z
  .string()
  .trim()
  .min(4, "Enter your invite code.")
  .max(40, "That doesn't look like a valid invite code.");

/** A co-parent redeeming an invite code by creating their own login. */
export const joinFamilySchema = z.object({
  code: inviteCodeSchema,
  name: personNameSchema,
  email: emailSchema,
  password: passwordSchema,
  consent: z
    .boolean()
    .refine((v) => v === true, "Parental consent is required to continue."),
});

export const kidSignInSchema = z.object({
  familyId: z.string().uuid(),
  personId: z.string().uuid(),
  pin: pinSchema,
});

export const familyCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]+-[A-Z0-9]+$/, "Enter a valid family code.");

/* --------------------------------------------------------------- people */

export const addKidSchema = z.object({
  name: personNameSchema,
  avatar: iconSchema,
  color: colorSchema,
  pin: pinSchema,
});

export const updateKidSchema = z.object({
  name: personNameSchema,
  avatar: iconSchema,
  color: colorSchema,
});

/* -------------------------------------------------------------- catalog */

export const choreSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(60),
  emoji: iconSchema,
  points: z.coerce
    .number()
    .int("Points must be a whole number.")
    .min(0)
    .max(100000),
  description: z.string().trim().max(280).optional(),
  /** How often a kid may claim it. "none" = unlimited; count applies otherwise. */
  limitPeriod: z.enum(["none", "day", "week"]).default("none"),
  limitCount: z.coerce
    .number()
    .int("Enter a whole number.")
    .min(1, "Must be at least 1.")
    .max(50, "That's a lot — keep it 50 or under.")
    .default(1),
});

export const rewardSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(60),
  emoji: iconSchema,
  cost: z.coerce
    .number()
    .int("Cost must be a whole number.")
    .min(0)
    .max(100000),
  description: z.string().trim().max(280).optional(),
});

/* ---------------------------------------------------- points & redemptions */

export const customAwardSchema = z.object({
  kidId: z.string().uuid(),
  amount: z.coerce
    .number()
    .int("Use a whole number.")
    .min(1, "Enter a positive amount.")
    .max(100000),
  reason: z.string().trim().min(1, "Add a reason.").max(140),
});

export const adjustSchema = z.object({
  kidId: z.string().uuid(),
  amount: z.coerce
    .number()
    .int("Use a whole number.")
    .min(-100000)
    .max(100000)
    .refine((n) => n !== 0, "Amount can't be zero."),
  reason: z.string().trim().min(1, "Add a reason.").max(140),
});

export const awardChoresSchema = z.object({
  kidId: z.string().uuid(),
  choreIds: z.array(z.string().uuid()).min(1, "Pick at least one chore."),
});

export const requestRedemptionSchema = z.object({
  rewardId: z.string().uuid(),
});

export const decideRedemptionSchema = z.object({
  redemptionId: z.string().uuid(),
  decision: z.enum(["approved", "denied"]),
  note: z.string().trim().max(280).optional(),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type AddKidInput = z.infer<typeof addKidSchema>;
export type ChoreInput = z.infer<typeof choreSchema>;
export type RewardInput = z.infer<typeof rewardSchema>;
