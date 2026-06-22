import "server-only";
import { cookies } from "next/headers";
import { requireEnv } from "@/lib/env";
import {
  SESSION_COOKIE,
  verifySessionToken,
  type SessionPayload,
} from "./token";
import { SignJWT } from "jose";

export type { SessionPayload } from "./token";

const ALG = "HS256";
const DEFAULT_MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30 days

function key(): Uint8Array {
  return new TextEncoder().encode(requireEnv("AUTH_SECRET"));
}

/** Sign a session JWT and set it as an HTTP-only cookie. */
export async function createSession(
  payload: Omit<SessionPayload, "ver"> & { ver?: number },
  maxAgeSec: number = DEFAULT_MAX_AGE_SEC,
): Promise<void> {
  const token = await new SignJWT({
    familyId: payload.familyId,
    personId: payload.personId,
    role: payload.role,
    ver: payload.ver ?? 1,
  })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSec}s`)
    .sign(key());

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSec,
  });
}

/** Read and verify the current session, or null if absent/invalid. */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token, requireEnv("AUTH_SECRET"));
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** Throw-on-missing helpers for use inside server actions. */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated");
  return session;
}

export async function requireParent(): Promise<SessionPayload> {
  const session = await requireSession();
  if (session.role !== "parent") throw new Error("Forbidden: parents only");
  return session;
}
