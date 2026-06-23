"use client";

import { useEffect, useState } from "react";
import { setFamilyTimezoneAction } from "@/app/actions/family";
import styles from "./family.module.css";

const COMMON = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Australia/Sydney",
];

function allZones(): string[] {
  const sv = (Intl as { supportedValuesOf?: (k: string) => string[] })
    .supportedValuesOf;
  try {
    const z = sv?.("timeZone");
    if (z && z.length) return z;
  } catch {
    /* not supported */
  }
  return COMMON;
}

export function FamilyTimezone({ current }: { current: string }) {
  const [tz, setTz] = useState(current);
  const [saved, setSaved] = useState(false);

  // Auto-detect once for families that never set a timezone (still "UTC").
  useEffect(() => {
    if (current !== "UTC") return;
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!detected || detected === "UTC") return;
    void (async () => {
      const res = await setFamilyTimezoneAction(detected);
      if (res.ok) setTz(detected);
    })();
  }, [current]);

  const zones = allZones();
  const list = zones.includes(tz) ? zones : [tz, ...zones];

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
