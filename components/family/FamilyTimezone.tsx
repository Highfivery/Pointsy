"use client";

import { useEffect, useState } from "react";
import { setFamilyTimezoneAction } from "@/app/actions/family";
import styles from "./family.module.css";

/**
 * A curated, DETERMINISTIC list of common IANA zones. We deliberately do NOT use
 * `Intl.supportedValuesOf("timeZone")` here: the server (Node) and browser can
 * return different lists, which causes a hydration mismatch in this SSR'd client
 * component. The exact family zone is still captured automatically (below).
 */
const TIMEZONES = [
  "UTC",
  "Pacific/Honolulu",
  "America/Anchorage",
  "America/Los_Angeles",
  "America/Denver",
  "America/Phoenix",
  "America/Chicago",
  "America/New_York",
  "America/Toronto",
  "America/Halifax",
  "America/Mexico_City",
  "America/Bogota",
  "America/Lima",
  "America/Sao_Paulo",
  "America/Argentina/Buenos_Aires",
  "Atlantic/Reykjavik",
  "Europe/London",
  "Europe/Dublin",
  "Europe/Lisbon",
  "Europe/Madrid",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Amsterdam",
  "Europe/Rome",
  "Europe/Zurich",
  "Europe/Stockholm",
  "Europe/Warsaw",
  "Europe/Athens",
  "Europe/Helsinki",
  "Europe/Istanbul",
  "Europe/Moscow",
  "Africa/Casablanca",
  "Africa/Lagos",
  "Africa/Johannesburg",
  "Africa/Nairobi",
  "Africa/Cairo",
  "Asia/Jerusalem",
  "Asia/Dubai",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Dhaka",
  "Asia/Bangkok",
  "Asia/Jakarta",
  "Asia/Singapore",
  "Asia/Hong_Kong",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Australia/Perth",
  "Australia/Adelaide",
  "Australia/Sydney",
  "Pacific/Auckland",
];

export function FamilyTimezone({ current }: { current: string }) {
  const [tz, setTz] = useState(current);
  const [saved, setSaved] = useState(false);

  // Auto-detect once for families that never set a timezone (still "UTC").
  // Runs only on the client, in an effect — no render-time, no hydration risk.
  useEffect(() => {
    if (current !== "UTC") return;
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!detected || detected === "UTC") return;
    void (async () => {
      const res = await setFamilyTimezoneAction(detected);
      if (res.ok) setTz(detected);
    })();
  }, [current]);

  const list = TIMEZONES.includes(tz) ? TIMEZONES : [tz, ...TIMEZONES];

  async function onChange(value: string) {
    setTz(value);
    setSaved(false);
    const res = await setFamilyTimezoneAction(value);
    if (res.ok) setSaved(true);
  }

  return (
    <div className={styles.tz}>
      <select
        id="family-tz"
        aria-label="Family time zone"
        value={tz}
        onChange={(e) => void onChange(e.target.value)}
        className={styles.tzSelect}
      >
        {list.map((z) => (
          <option key={z} value={z}>
            {z.replace(/_/g, " ")}
          </option>
        ))}
      </select>
      <p className={styles.tzHint} aria-live="polite">
        {saved
          ? "Saved."
          : "Daily and weekly chore limits reset at your local midnight."}
      </p>
    </div>
  );
}
