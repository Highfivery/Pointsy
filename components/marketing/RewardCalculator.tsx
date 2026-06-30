"use client";

import { useState } from "react";
import styles from "./reward-calculator.module.css";

const FREQS = [
  { w: 0.4, label: "A treat", sub: "a few times a week" },
  { w: 1, label: "Weekly", sub: "a regular reward" },
  { w: 4, label: "Monthly", sub: "something bigger" },
  { w: 10, label: "A big goal", sub: "every few months" },
] as const;

const TIERS = [
  {
    name: "Small",
    weeks: 1,
    note: "about a week of effort",
    ideas: [
      "30 min extra screen time",
      "Pick the family movie",
      "Stay up 15 min later",
      "A small treat",
    ],
  },
  {
    name: "Medium",
    weeks: 4,
    note: "about a month of effort",
    ideas: [
      "A trip to the park or pool",
      "Friend sleepover",
      "Choose a day’s dinner",
      "A small toy or book",
    ],
  },
  {
    name: "Big goal",
    weeks: 10,
    note: "a few months of saving",
    ideas: [
      "Day out / cinema trip",
      "A bigger wished-for item",
      "Family pizza & game night",
      "A special experience",
    ],
  },
];

const nice = (n: number) =>
  n < 100 ? Math.round(n / 5) * 5 : Math.round(n / 25) * 25;

export function RewardCalculator() {
  const [weekly, setWeekly] = useState(50);
  const [weeks, setWeeks] = useState<number>(4);

  const cost = nice(weekly * weeks);
  const freqLabel =
    FREQS.find((f) => f.w === weeks)?.label.toLowerCase() ?? "monthly";
  const effort =
    weeks < 1 ? "a couple of days" : `${weeks} week${weeks > 1 ? "s" : ""}`;

  return (
    <>
      <div className={styles.calc}>
        <div className={styles.inputs}>
          <div className={styles.field}>
            <label htmlFor="weekly" className={styles.label}>
              Points earned in a typical week
              <span className={styles.val}>{weekly}</span>
            </label>
            <input
              id="weekly"
              type="range"
              min={10}
              max={200}
              step={5}
              value={weekly}
              aria-label="Points earned in a typical week"
              onChange={(e) => setWeekly(Number(e.target.value))}
              className={styles.range}
            />
          </div>

          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>
              How often should they afford this reward?
            </legend>
            <div className={styles.seg}>
              {FREQS.map((f) => (
                <button
                  key={f.w}
                  type="button"
                  className={styles.segBtn}
                  aria-pressed={weeks === f.w}
                  aria-label={`${f.label}: ${f.sub}`}
                  onClick={() => setWeeks(f.w)}
                >
                  <span aria-hidden="true">{f.label}</span>
                  <span className={styles.segSub} aria-hidden="true">
                    {f.sub}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        <div className={styles.result} aria-live="polite">
          <p className={styles.resultNum}>
            <span className={styles.approx}>≈</span>
            {cost}
            <span className={styles.unit}>pts</span>
          </p>
          <p className={styles.resultCap}>suggested cost for this reward</p>
          <p className={styles.resultSentence}>
            At <strong>{weekly} pts/week</strong>, a{" "}
            <strong>{freqLabel}</strong> reward should cost about{" "}
            <strong>{cost} points</strong> — roughly {effort} of effort.
          </p>
        </div>
      </div>

      <div className={styles.menuHead}>
        <h2 className={styles.menuTitle}>Your starter reward menu</h2>
        <p className={styles.menuLead}>
          Three price tiers based on <strong>{weekly}</strong> points a week —
          copy these straight into Pointsy.
        </p>
      </div>
      <ul className={styles.tiers}>
        {TIERS.map((t) => (
          <li key={t.name} className={styles.tier}>
            <h3 className={styles.tierHead}>
              {t.name}
              <span className={styles.tierCost}>
                {nice(weekly * t.weeks)} pts
              </span>
            </h3>
            <p className={styles.tierNote}>{t.note}</p>
            <ul className={styles.tierIdeas}>
              {t.ideas.map((idea) => (
                <li key={idea}>{idea}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </>
  );
}
