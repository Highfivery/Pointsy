import { randomBytes, createHash } from "node:crypto";

/**
 * Parent-invite codes. A high-entropy, human-shareable code is shown to the
 * inviting parent once; only its SHA-256 hash is stored (a bearer token, so we
 * never keep the plaintext). ~39 bits of entropy + single-use + 72h expiry.
 */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no ambiguous 0/O/1/I/L

export function generateInviteCode(): string {
  const bytes = randomBytes(8);
  let s = "";
  for (let i = 0; i < 8; i++) s += ALPHABET[bytes[i] % ALPHABET.length];
  return `PRNT-${s.slice(0, 4)}-${s.slice(4)}`;
}

export function normalizeInviteCode(code: string): string {
  return code.trim().toUpperCase();
}

export function hashInviteCode(code: string): string {
  return createHash("sha256").update(normalizeInviteCode(code)).digest("hex");
}
