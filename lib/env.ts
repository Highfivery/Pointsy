import { z } from "zod";

/**
 * Centralised, validated environment access.
 *
 * Secrets are optional at the schema level so that `next build` (and any code
 * path that never touches the DB/auth) does not crash when they are absent.
 * Use {@link requireEnv} at the point of use to fail loudly when a value that
 * is genuinely required is missing.
 */
const schema = z.object({
  DATABASE_URL: z.string().url().optional(),
  /** 32+ byte secret used to sign session JWTs (HS256). */
  AUTH_SECRET: z.string().min(32).optional(),
  /** Web Push (VAPID). Push is disabled gracefully when these are unset. */
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().optional(),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

export const env = schema.parse(process.env);

export function requireEnv<K extends keyof typeof env>(
  key: K,
): NonNullable<(typeof env)[K]> {
  const value = env[key];
  if (value == null || value === "") {
    throw new Error(
      `Missing required environment variable: ${String(key)}. ` +
        `See .env.example for setup instructions.`,
    );
  }
  return value as NonNullable<(typeof env)[K]>;
}
