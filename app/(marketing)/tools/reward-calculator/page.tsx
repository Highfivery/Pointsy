import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronRight,
  ChevronDown,
  ArrowRight,
  Scale,
  Calculator,
} from "lucide-react";
import { RewardCalculator } from "@/components/marketing/RewardCalculator";
import cmp from "@/components/marketing/comparison.module.css";
import calc from "@/components/marketing/reward-calculator.module.css";

const SITE_URL = "https://pointsy.kids";

export const metadata: Metadata = {
  title: "Reward Points Calculator — How Many Points Should a Reward Cost?",
  description:
    "A free calculator that suggests how many points each reward should cost, based on how much your child earns and how often they should afford it. Builds a starter reward menu.",
  alternates: { canonical: "/tools/reward-calculator" },
};

const METHOD = [
  {
    n: "1",
    title: "Count weekly points",
    text: "Add up the points a child earns from their usual chores in a normal week. The slider stands in for that number.",
  },
  {
    n: "2",
    title: "Pick a pace",
    text: "Decide how often a reward should be within reach — a frequent treat, a weekly win, a monthly prize, or a save-up goal.",
  },
  {
    n: "3",
    title: "Price = weeks × weekly points",
    text: "A reward they should afford monthly costs about four weeks of points. That keeps rewards motivating — not instant, not impossible.",
  },
];

const FAQ = [
  {
    q: "What if my child earns a different amount each week?",
    a: "Use a typical week as your guide. In Pointsy you can tweak a reward’s cost anytime — balances come from a running ledger, so nothing breaks if you adjust.",
  },
  {
    q: "Should rewards cost real money?",
    a: "They don’t have to — most families use experiences and privileges like screen time, outings, or choosing dinner. Pointsy uses points, not real money, so there’s nothing to fund.",
  },
  {
    q: "How do I set these up?",
    a: "Create a free family, add a reward, and enter the suggested cost. Kids redeem points for it and you approve each one. It takes under a minute.",
  },
];

export default function RewardCalculatorPage() {
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Reward calculator",
        item: `${SITE_URL}/tools/reward-calculator`,
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
            <span aria-current="page">Reward calculator</span>
          </nav>

          <header className={cmp.hero}>
            <p className={cmp.eyebrow}>Free tool · no sign-up</p>
            <h1 className={cmp.h1}>
              How many points should a <span className={cmp.grad}>reward</span>{" "}
              cost?
            </h1>
            <p className={cmp.lede}>
              A good rule of thumb: a reward should cost about as many points as
              you want your child to work for it. Tell us how much they earn in
              a typical week and how often they should afford it — we’ll suggest
              a fair price and a ready-made reward menu.
            </p>
          </header>

          <RewardCalculator />

          <section className={cmp.section} aria-labelledby="method-h">
            <h2 className={cmp.h2} id="method-h">
              How the calculator works
            </h2>
            <ul className={calc.method}>
              {METHOD.map((m) => (
                <li key={m.n} className={calc.methodCard}>
                  <span className={calc.methodNum}>{m.n}</span>
                  <strong>{m.title}</strong>
                  <p>{m.text}</p>
                </li>
              ))}
            </ul>
          </section>

          <section
            className={`${cmp.section} ${cmp.faqBlock}`}
            aria-labelledby="calc-faq-h"
          >
            <h2 className={cmp.h2} id="calc-faq-h">
              Common questions
            </h2>
            <div className={cmp.faqList}>
              {FAQ.map((f, i) => (
                <details
                  key={f.q}
                  className={cmp.faq}
                  open={i === 0}
                  name="calc-faq"
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
            <h2 className={cmp.ctaTitle}>Set up your reward menu free</h2>
            <p className={cmp.ctaText}>
              Pointsy is a free, private, no-app-store way to turn chores into
              points kids redeem for the rewards you set.
            </p>
            <a className={cmp.ctaBtn} href="/sign-up">
              Create your family — it’s free
              <ArrowRight size={18} aria-hidden="true" />
            </a>
            <div className={cmp.crossLinks}>
              <Link href="/tools/allowance-calculator">
                <Calculator size={16} aria-hidden="true" /> Allowance calculator
              </Link>
              <Link href="/compare">
                <Scale size={16} aria-hidden="true" /> Compare to other apps
              </Link>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
