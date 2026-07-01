"use client";

import { useState } from "react";
import calc from "./reward-calculator.module.css";
import a from "./allowance-calculator.module.css";

/** Age bands with the typical weekly allowance ranges parents report (USD).
 * Figures are common ranges, not rules — kept deliberately rounded. */
const BANDS = [
  { label: "4–5", low: 2, high: 5 },
  { label: "6–8", low: 5, high: 8 },
  { label: "9–11", low: 8, high: 12 },
  { label: "12–14", low: 12, high: 18 },
  { label: "15–18", low: 18, high: 35 },
];

const POINTS_PER_DOLLAR = 10;

const half = (n: number) => Math.round(n * 2) / 2;
const money = (n: number) =>
  Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;

export function AllowanceCalculator() {
  const [age, setAge] = useState(10);
  const [mode, setMode] = useState<"dollars" | "points">("dollars");

  // "$1 per year of age" rule of thumb, with a typical range around it.
  const weekly = age;
  const low = half(age * 0.5);
  const high = half(age * 1.5);
  const points = mode === "points";

  const main = points ? `${weekly * POINTS_PER_DOLLAR}` : money(weekly);
  const unit = points ? "pts" : "";
  const rangeText = points
    ? `${low * POINTS_PER_DOLLAR}–${high * POINTS_PER_DOLLAR} pts`
    : `${money(low)}–${money(high)}`;

  return (
    <>
      <div className={calc.calc}>
        <div className={calc.inputs}>
          <div className={calc.field}>
            <label htmlFor="age" className={calc.label}>
              Your child’s age
              <span className={calc.val}>{age}</span>
            </label>
            <input
              id="age"
              type="range"
              min={3}
              max={18}
              step={1}
              value={age}
              aria-label="Your child’s age"
              onChange={(e) => setAge(Number(e.target.value))}
              className={calc.range}
            />
          </div>

          <fieldset className={calc.fieldset}>
            <legend className={calc.legend}>Show the amount as</legend>
            <div className={calc.seg}>
              <button
                type="button"
                className={calc.segBtn}
                aria-pressed={mode === "dollars"}
                aria-label="Dollars — the $1 per year of age rule"
                onClick={() => setMode("dollars")}
              >
                <span aria-hidden="true">Dollars</span>
                <span className={calc.segSub} aria-hidden="true">
                  $1 per year of age
                </span>
              </button>
              <button
                type="button"
                className={calc.segBtn}
                aria-pressed={mode === "points"}
                aria-label="Pointsy points — ten points per dollar"
                onClick={() => setMode("points")}
              >
                <span aria-hidden="true">Pointsy points</span>
                <span className={calc.segSub} aria-hidden="true">
                  10 points = $1
                </span>
              </button>
            </div>
          </fieldset>
        </div>

        <div className={calc.result} aria-live="polite">
          <p className={calc.resultNum}>
            <span className={calc.approx}>≈</span>
            {main}
            {unit ? <span className={calc.unit}>{unit}</span> : null}
          </p>
          <p className={calc.resultCap}>a week, as a starting point</p>
          <p className={calc.resultSentence}>
            For a <strong>{age}-year-old</strong>, a common starting point is{" "}
            <strong>
              {main}
              {unit ? ` ${unit}` : ""} a week
            </strong>{" "}
            — most families land in the <strong>{rangeText}</strong> range.
          </p>
        </div>
      </div>

      <div className={a.byAgeHead}>
        <h2 className={a.byAgeTitle}>Typical weekly allowance by age</h2>
        <p className={a.byAgeLead}>
          What parents commonly give, in dollars — with the Pointsy points
          equivalent at 10 points per $1.
        </p>
      </div>
      <div className={a.tableScroll}>
        <table className={a.table}>
          <thead>
            <tr>
              <th scope="col">Age</th>
              <th scope="col">Typical / week</th>
              <th scope="col" className={a.pointsCol}>
                As points
              </th>
            </tr>
          </thead>
          <tbody>
            {BANDS.map((b) => (
              <tr key={b.label}>
                <th scope="row">{b.label}</th>
                <td data-label="Typical / week">
                  {money(b.low)}–{money(b.high)}
                </td>
                <td className={a.pointsCol} data-label="As points">
                  {b.low * POINTS_PER_DOLLAR}–{b.high * POINTS_PER_DOLLAR} pts
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={a.note}>
        Ranges are typical, not rules — averages hover around $13/week for ages
        5–19, rising into the teens. Adjust for your budget and what the
        allowance is expected to cover.
      </p>
    </>
  );
}
