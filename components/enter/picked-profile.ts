/**
 * Remembers which profile was just tapped on the picker, per browser tab, for a
 * short time. If the page reloads or remounts while the PIN pad is up (for
 * example an app update landing on a shared tablet), the kid comes back to
 * their PIN pad instead of the profile picker. It holds ids only, never a PIN,
 * and the PIN is still required, so it grants nothing.
 *
 * Exposed as a tiny external store so `KidLogin` can read it with
 * `useSyncExternalStore` (server snapshot = nothing picked, so hydration is
 * stable and there is no set-state-in-effect).
 */

const KEY = "pointsy.pickedProfile";
/** How long a tap is remembered. Long enough for a reload, short enough that a
 *  device left alone returns to the picker. */
export const PICKED_PROFILE_TTL_MS = 2 * 60 * 1000;

interface Stored {
  familyId: string;
  personId: string;
  at: number;
}

const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedValue: Stored | null = null;

function readRaw(): string | null {
  try {
    return window.sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function parse(raw: string | null): Stored | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<Stored>;
    if (
      typeof v.familyId === "string" &&
      typeof v.personId === "string" &&
      typeof v.at === "number"
    ) {
      return { familyId: v.familyId, personId: v.personId, at: v.at };
    }
  } catch {
    /* ignore malformed */
  }
  return null;
}

/**
 * Current snapshot. Cached by raw string so the reference is stable, and the
 * freshness check lives here (outside render) so components stay pure.
 */
function snapshot(): Stored | null {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedValue = parse(raw);
  }
  if (cachedValue && !isFresh(cachedValue, Date.now())) return null;
  return cachedValue;
}

function isFresh(v: Stored, now: number): boolean {
  return now >= v.at && now - v.at <= PICKED_PROFILE_TTL_MS;
}

function notify() {
  listeners.forEach((l) => l());
}

export function subscribePickedProfile(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function getPickedProfileSnapshot(): Stored | null {
  return snapshot();
}

export function getPickedProfileServerSnapshot(): Stored | null {
  return null;
}

/** The remembered person, if the (fresh) snapshot is for this family. */
export function pickFor(
  picked: Stored | null,
  familyId: string,
): string | null {
  return picked && picked.familyId === familyId ? picked.personId : null;
}

export function rememberPickedProfile(familyId: string, personId: string) {
  try {
    window.sessionStorage.setItem(
      KEY,
      JSON.stringify({ familyId, personId, at: Date.now() }),
    );
  } catch {
    /* storage blocked (private mode): fine, just no memory */
  }
  notify();
}

export function clearPickedProfile() {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  notify();
}
