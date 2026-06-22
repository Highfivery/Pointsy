import { hash, verify } from "@node-rs/argon2";

/**
 * Argon2id hashing for passwords and PINs.
 *
 * @node-rs/argon2 ships prebuilt native binaries (no compile step) and defaults
 * to the argon2id variant. These functions run only in the Node.js runtime
 * (server actions) — never in middleware/edge.
 */
const OPTIONS = {
  // OWASP-aligned defaults; tune if hashing latency becomes an issue.
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

export function hashSecret(plain: string): Promise<string> {
  return hash(plain, OPTIONS);
}

export function verifySecret(
  storedHash: string,
  plain: string,
): Promise<boolean> {
  return verify(storedHash, plain, OPTIONS);
}
