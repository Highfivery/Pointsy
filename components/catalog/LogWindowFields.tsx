"use client";

import { useId, useMemo, useState } from "react";
import { Clock, Sun, Moon, Eye } from "lucide-react";
import styles from "./chore-editor.module.css";

export interface LogWindowDefaults {
  logWindowDays?: number | null;
  logWindowStart?: string | null;
  logWindowEnd?: string | null;
}

type TimeMode = "any" | "after" | "before" | "between";

const DAYS = [
  { letter: "M", name: "Monday" },
  { letter: "T", name: "Tuesday" },
  { letter: "W", name: "Wednesday" },
  { letter: "T", name: "Thursday" },
  { letter: "F", name: "Friday" },
  { letter: "S", name: "Saturday" },
  { letter: "S", name: "Sunday" },
];
const WEEKDAYS = [true, true, true, true, true, false, false];
const WEEKENDS = [false, false, false, false, false, true, true];
const EVERY_DAY = [true, true, true, true, true, true, true];

function maskToBools(mask: number | null | undefined): boolean[] {
  if (mask === null || mask === undefined) return [...EVERY_DAY];
  return DAYS.map((_, i) => (mask & (1 << i)) !== 0);
}

function sameDays(a: boolean[], b: boolean[]): boolean {
  return a.every((v, i) => v === b[i]);
}

function modeFor(start?: string | null, end?: string | null): TimeMode {
  if (start && end) return "between";
  if (start) return "after";
  if (end) return "before";
  return "any";
}

/** 12-hour label for a "HH:MM" string, e.g. "6:00 PM". */
function fmt(time: string): string {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const ap = h < 12 ? "AM" : "PM";
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${String(m).padStart(2, "0")} ${ap}`;
}

/**
 * The "When can it be logged?" editor controls: a weekday selector plus an
 * optional time-of-day window. Emits `logWindowDays` (one checkbox per selected
 * day; 0 or 7 selected = every day → null mask server-side) and the
 * `logWindowStart` / `logWindowEnd` time inputs (absent = no bound → null).
 */
export function LogWindowFields({
  defaults,
}: {
  defaults?: LogWindowDefaults;
}) {
  const [days, setDays] = useState<boolean[]>(() =>
    maskToBools(defaults?.logWindowDays),
  );
  const [mode, setMode] = useState<TimeMode>(() =>
    modeFor(defaults?.logWindowStart, defaults?.logWindowEnd),
  );
  const [start, setStart] = useState(defaults?.logWindowStart ?? "");
  const [end, setEnd] = useState(defaults?.logWindowEnd ?? "");
  const modeId = useId();

  const everyDay = useMemo(
    () => sameDays(days, EVERY_DAY) || days.every((d) => !d),
    [days],
  );

  const daysPhrase = useMemo(() => {
    if (everyDay) return "every day";
    if (sameDays(days, WEEKDAYS)) return "on weekdays";
    if (sameDays(days, WEEKENDS)) return "on weekends";
    const picked = DAYS.filter((_, i) => days[i]).map((d) =>
      d.name.slice(0, 3),
    );
    return `on ${picked.join(", ")}`;
  }, [days, everyDay]);

  const timeError =
    mode === "between" && start && end && end <= start
      ? "Close time must be after open time."
      : null;

  const preview = useMemo(() => {
    let time = "";
    if (mode === "after" && start) time = `after ${fmt(start)}`;
    else if (mode === "before" && end) time = `before ${fmt(end)}`;
    else if (mode === "between" && start && end)
      time = `between ${fmt(start)} and ${fmt(end)}`;
    if (everyDay && !time) return "Kids can log this any time.";
    return `Kids can log this ${daysPhrase}${time ? `, ${time}` : ""}.`;
  }, [mode, start, end, everyDay, daysPhrase]);

  const showStart = mode === "after" || mode === "between";
  const showEnd = mode === "before" || mode === "between";

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>
        <Clock size={18} aria-hidden="true" className={styles.titleIcon} />
        When can it be logged?
      </h2>
      <p className={styles.muted}>
        Limit the days and times a kid can log this. You can still award it
        manually any time.
      </p>

      <fieldset className={styles.windowGroup}>
        <legend className={styles.windowLegend}>Which days?</legend>
        <div className={styles.presetRow}>
          {(
            [
              ["Every day", EVERY_DAY],
              ["Weekdays", WEEKDAYS],
              ["Weekends", WEEKENDS],
            ] as const
          ).map(([label, preset]) => (
            <button
              key={label}
              type="button"
              className={
                sameDays(days, preset) || (label === "Every day" && everyDay)
                  ? styles.presetActive
                  : styles.preset
              }
              aria-pressed={
                sameDays(days, preset) || (label === "Every day" && everyDay)
              }
              onClick={() => setDays([...preset])}
            >
              {label}
            </button>
          ))}
        </div>
        <div className={styles.dayRow}>
          {DAYS.map((d, i) => (
            <label key={i} className={styles.dayChip}>
              <input
                type="checkbox"
                name="logWindowDays"
                value={i}
                checked={days[i]}
                aria-label={d.name}
                className={styles.dayInput}
                onChange={() =>
                  setDays((prev) => prev.map((v, j) => (j === i ? !v : v)))
                }
              />
              <span aria-hidden="true">{d.letter}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className={styles.windowGroup}>
        <label htmlFor={modeId} className={styles.windowLegend}>
          Time of day
        </label>
        <select
          id={modeId}
          className={styles.select}
          value={mode}
          onChange={(e) => setMode(e.target.value as TimeMode)}
        >
          <option value="any">Any time</option>
          <option value="after">Only after a time</option>
          <option value="before">Only before a time</option>
          <option value="between">Only between two times</option>
        </select>

        {showStart || showEnd ? (
          <div className={styles.timeGrid}>
            {showStart ? (
              <div className={styles.timeField}>
                <label htmlFor="logWindowStart" className={styles.timeLabel}>
                  <Sun size={15} aria-hidden="true" /> Opens at
                </label>
                <input
                  id="logWindowStart"
                  type="time"
                  name="logWindowStart"
                  aria-label="Opens at"
                  className={styles.timeInput}
                  value={start}
                  required
                  onChange={(e) => setStart(e.target.value)}
                />
              </div>
            ) : null}
            {showEnd ? (
              <div className={styles.timeField}>
                <label htmlFor="logWindowEnd" className={styles.timeLabel}>
                  <Moon size={15} aria-hidden="true" /> Closes at
                </label>
                <input
                  id="logWindowEnd"
                  type="time"
                  name="logWindowEnd"
                  aria-label="Closes at"
                  className={styles.timeInput}
                  value={end}
                  required
                  onChange={(e) => setEnd(e.target.value)}
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {timeError ? (
        <p className={styles.previewError} role="alert">
          {timeError}
        </p>
      ) : (
        <p className={styles.preview}>
          <Eye size={16} aria-hidden="true" />
          <span>{preview}</span>
        </p>
      )}
    </section>
  );
}
