import { jwtVerify } from "jose";

/**
 * Edge-safe session token utilities (no `next/headers`, no Node APIs) so they
 * can run in middleware as well as server actions.
 */
export const SESSION_COOKIE = "pointsy_session";

export interface SessionPayload {
  familyId: string;
  personId: string;
  role: "parent" | "kid";
  /** Token version, for global invalidation. */
  ver: number;
}

function isSessionPayload(value: unknown): value is SessionPayload {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.familyId === "string" &&
    typeof v.personId === "string" &&
    (v.role === "parent" || v.role === "kid") &&
    typeof v.ver === "number"
  );
}

/** Verify a session JWT. Returns the payload, or null if invalid/expired. */
export async function verifySessionToken(
  token: string,
  secret: string,
): Promise<SessionPayload | null> {
  try {
    const key = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    return isSessionPayload(payload) ? payload : null;
  } catch {
    return null;
  }
}
