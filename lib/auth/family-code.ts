/**
 * Family join/login codes — short, human-friendly, unambiguous.
 *
 * Format: `<PREFIX>-<RAND>` e.g. "MARSH-7Q2". The prefix is derived from the
 * family name; the suffix is random from an alphabet that omits easily-confused
 * characters (0/O, 1/I/L). Callers must check uniqueness against the DB and
 * regenerate on collision.
 */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function randomChars(count: number): string {
  const bytes = new Uint8Array(count);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < count; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

export function familyCodePrefix(name: string): string {
  const cleaned = name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 5);
  return cleaned.length >= 2 ? cleaned : "FAM";
}

export function generateFamilyCode(name: string, suffixLength = 3): string {
  return `${familyCodePrefix(name)}-${randomChars(suffixLength)}`;
}
