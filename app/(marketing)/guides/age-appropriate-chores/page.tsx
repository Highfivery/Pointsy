import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronRight,
  ChevronDown,
  ArrowRight,
  Check,
  Gift,
  CircleDollarSign,
} from "lucide-react";
import cmp from "@/components/marketing/comparison.module.css";
import g from "@/components/marketing/guide.module.css";

const SITE_URL = "https://pointsy.kids";

export const metadata: Metadata = {
  title: "Age-Appropriate Chores by Age — The Complete Chart (2026)",
  description:
    "A complete age-appropriate chores chart, from toddlers to teens — what kids can do at each stage, with suggested points. Free, on-page, no download needed.",
  alternates: { canonical: "/guides/age-appropriate-chores" },
};

const SUMMARY = [
  { age: "2–3", unlocks: "Tidying up after themselves", pts: "2–3 pts" },
  { age: "4–5", unlocks: "Simple daily routines", pts: "3–5 pts" },
  { age: "6–8", unlocks: "Independent chores & pet care", pts: "5–8 pts" },
  { age: "9–11", unlocks: "Kitchen & outdoor help", pts: "8–12 pts" },
  { age: "12–14", unlocks: "Full chores, start to finish", pts: "12–18 pts" },
  { age: "15+", unlocks: "Adult-level responsibility", pts: "15–25 pts" },
];

const BANDS = [
  {
    age: "Ages 2–3",
    pts: "2–3 pts",
    note: "Toddlers — short, playful tasks with you nearby.",
    chores: [
      "Put toys in a bin",
      "Clothes in the hamper",
      "Wipe up spills",
      "Feed pets (with help)",
      "Dust with a sock",
      "Stack books",
    ],
  },
  {
    age: "Ages 4–5",
    pts: "3–5 pts",
    note: "Simple routines they can own with reminders.",
    chores: [
      "Make their bed",
      "Set & clear the table",
      "Water plants",
      "Sort laundry by colour",
      "Tidy their room",
      "Match socks",
    ],
  },
  {
    age: "Ages 6–8",
    pts: "5–8 pts",
    note: "More independence and daily responsibility.",
    chores: [
      "Make bed neatly",
      "Feed & water pets",
      "Sweep or vacuum",
      "Pack their school bag",
      "Fold laundry",
      "Take out recycling",
    ],
  },
  {
    age: "Ages 9–11",
    pts: "8–12 pts",
    note: "Kitchen and outdoor jobs, with less supervision.",
    chores: [
      "Load/unload dishwasher",
      "Take out the trash",
      "Help cook a meal",
      "Clean the bathroom sink",
      "Walk the dog",
      "Rake leaves",
    ],
  },
  {
    age: "Ages 12–14",
    pts: "12–18 pts",
    note: "Full chores, start to finish, on their own.",
    chores: [
      "Laundry start to finish",
      "Cook a simple meal",
      "Mow the lawn",
      "Wash the car",
      "Clean the kitchen",
      "Watch younger siblings",
    ],
  },
  {
    age: "Ages 15+",
    pts: "15–25 pts",
    note: "Adult-level tasks and managing their own time.",
    chores: [
      "Plan & cook full meals",
      "Deep-clean rooms",
      "Grocery shop from a list",
      "Yard work",
      "Run errands",
      "Manage own schedule",
    ],
  },
];

const FAQ = [
  {
    q: "What chores can a 5-year-old do?",
    a: "A 5-year-old can make their bed, set and clear the table, put away toys, sort laundry, water plants, and feed a pet with help. Keep tasks short and specific.",
  },
  {
    q: "Should young kids be paid for chores?",
    a: "Many families use points or privileges rather than cash for younger kids — it teaches responsibility without handing over money. Pointsy is built exactly for that: points now, real money later if you choose.",
  },
  {
    q: "How many chores is too many?",
    a: "Start with 1–3 daily chores and add as they build the habit. Consistency matters more than volume — a few chores done every day beats a long list done rarely.",
  },
];

export default function ChoresByAgePage() {
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Guides",
        item: `${SITE_URL}/guides/age-appropriate-chores`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Age-appropriate chores",
        item: `${SITE_URL}/guides/age-appropriate-chores`,
      },
    ],
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <main id="main" className={cmp.main}>
        <div className={cmp.inner}>
          <nav className={cmp.crumb} aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <ChevronRight size={14} aria-hidden="true" />
            <span aria-current="page">Age-appropriate chores</span>
          </nav>

          <header className={cmp.hero}>
            <p className={cmp.eyebrow}>Guide · updated 2026</p>
            <h1 className={cmp.h1}>
              Age-appropriate <span className={cmp.grad}>chores</span> by age
            </h1>
            <p className={cmp.lede}>
              Kids can start helping as toddlers and take on more each year. By
              4–5 they can make their bed and set the table; by 6–8 they can
              feed pets and sort laundry; 9–11s can load the dishwasher and help
              cook; and teens can run full chores start to finish. Here’s the
              complete chart by age — with suggested points for each stage.
            </p>
            <div className={g.toolbar}>
              <a className={cmp.ctaBtn} href="/sign-up">
                Track these in Pointsy — free
                <ArrowRight size={18} aria-hidden="true" />
              </a>
            </div>
          </header>

          {/* Summary table */}
          <section className={cmp.section} aria-labelledby="glance-h">
            <h2 className={cmp.h2} id="glance-h">
              The chart at a glance
            </h2>
            <div className={g.summaryWrap}>
              <table className={g.summary}>
                <thead>
                  <tr>
                    <th scope="col">Age</th>
                    <th scope="col">New this stage</th>
                    <th scope="col" className={g.ptsCol}>
                      Suggested points
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {SUMMARY.map((r) => (
                    <tr key={r.age}>
                      <th scope="row">{r.age}</th>
                      <td>{r.unlocks}</td>
                      <td className={g.ptsCol}>{r.pts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Age band cards */}
          <section className={cmp.section} aria-labelledby="full-h">
            <h2 className={cmp.h2} id="full-h">
              The full chart, age by age
            </h2>
            <p className={g.sectionLead}>
              Each stage builds on the last — keep the earlier chores going as
              new ones are added.
            </p>
            <ul className={g.bands}>
              {BANDS.map((b) => (
                <li key={b.age} className={g.band}>
                  <div className={g.bandTop}>
                    <h3 className={g.bandAge}>{b.age}</h3>
                    <span className={g.bandPts}>{b.pts}</span>
                  </div>
                  <p className={g.bandNote}>{b.note}</p>
                  <ul className={g.bandList}>
                    {b.chores.map((c) => (
                      <li key={c}>
                        <Check size={16} aria-hidden="true" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </section>

          {/* Tie-in to the calculators */}
          <section className={cmp.section} aria-labelledby="tiein-h">
            <div className={g.tiein}>
              <div>
                <h2 className={g.tieinTitle} id="tiein-h">
                  Turn the chart into points
                </h2>
                <p className={g.tieinText}>
                  Pick a few chores for your child’s age, set the suggested
                  points, and let them earn and redeem — no cash, no chart on
                  the fridge. Not sure what things should cost? The calculators
                  do the math.
                </p>
              </div>
              <div className={g.tieinLinks}>
                <Link href="/tools/reward-calculator" className={g.tieinLink}>
                  <Gift size={18} aria-hidden="true" />
                  Reward calculator — what should a reward cost?
                </Link>
                <Link
                  href="/tools/allowance-calculator"
                  className={g.tieinLink}
                >
                  <CircleDollarSign size={18} aria-hidden="true" />
                  Allowance calculator — points or cash by age?
                </Link>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section
            className={`${cmp.section} ${cmp.faqBlock}`}
            aria-labelledby="guide-faq-h"
          >
            <h2 className={cmp.h2} id="guide-faq-h">
              Common questions
            </h2>
            <div className={cmp.faqList}>
              {FAQ.map((f, i) => (
                <details
                  key={f.q}
                  className={cmp.faq}
                  open={i === 0}
                  name="guide-faq"
                >
                  <summary className={cmp.faqQ}>
                    {f.q}
                    <ChevronDown
                      size={20}
                      aria-hidden="true"
                      className={cmp.faqChev}
                    />
                  </summary>
                  <p className={cmp.faqA}>{f.a}</p>
                </details>
              ))}
            </div>
          </section>

          <section className={cmp.cta}>
            <h2 className={cmp.ctaTitle}>Make the chart actually stick</h2>
            <p className={cmp.ctaText}>
              Set age-appropriate chores as points your kids earn and redeem —
              free, private, and nothing to install.
            </p>
            <a className={cmp.ctaBtn} href="/sign-up">
              Create your family — it’s free
              <ArrowRight size={18} aria-hidden="true" />
            </a>
          </section>
        </div>
      </main>
    </>
  );
}
