import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronRight,
  ChevronDown,
  ArrowRight,
  Calculator,
  Scale,
} from "lucide-react";
import { AllowanceCalculator } from "@/components/marketing/AllowanceCalculator";
import cmp from "@/components/marketing/comparison.module.css";
import calc from "@/components/marketing/reward-calculator.module.css";

const SITE_URL = "https://pointsy.kids";

export const metadata: Metadata = {
  title: "Allowance by Age Calculator — How Much Should Kids Get? (2026)",
  description:
    "A free calculator for how much weekly allowance to give by age, using the $1-per-year rule and typical 2026 ranges. See the amount as cash or as Pointsy points.",
  alternates: { canonical: "/tools/allowance-calculator" },
};

const METHOD = [
  {
    n: "1",
    title: "The $1-per-year rule",
    text: "A widely used starting point: about $1 a week for each year of age. A 7-year-old gets ~$7, a 12-year-old ~$12.",
  },
  {
    n: "2",
    title: "Adjust to your family",
    text: "Averages sit around $13/week for ages 5–19. Nudge it up or down for your budget and what the allowance is meant to cover.",
  },
  {
    n: "3",
    title: "Cash or points",
    text: "Prefer not to hand over cash? Give the same value as Pointsy points and let kids redeem them for rewards you set.",
  },
];

const FAQ = [
  {
    q: "How much allowance should I give a 10-year-old?",
    a: "A common starting point is about $10 a week — the “$1 per year of age” rule — though many families give roughly $5–$15 depending on budget and what the allowance is expected to cover.",
  },
  {
    q: "Should allowance be tied to chores?",
    a: "Parents and experts are split. Some tie it to chores to teach earning; others give a base allowance and pay extra for bigger jobs. Pointsy leans toward rewarding specific chores with points rather than a flat cash allowance — so kids earn what they do.",
  },
  {
    q: "Is it better to give cash or points?",
    a: "Points avoid handing young kids cash or a card, work at any age, and can be redeemed for rewards you choose. Many families prefer points for younger children and save real money for teens.",
  },
];

export default function AllowanceCalculatorPage() {
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Allowance calculator",
        item: `${SITE_URL}/tools/allowance-calculator`,
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
            <span aria-current="page">Allowance calculator</span>
          </nav>

          <header className={cmp.hero}>
            <p className={cmp.eyebrow}>Free tool · no sign-up</p>
            <h1 className={cmp.h1}>
              How much <span className={cmp.grad}>allowance</span> by age?
            </h1>
            <p className={cmp.lede}>
              A common rule of thumb is about $1 per year of age each week — so
              roughly $10 a week for a 10-year-old — though families range
              widely. Set your child’s age for a starting figure, or switch to
              Pointsy points if you’d rather skip the cash.
            </p>
          </header>

          <AllowanceCalculator />

          <section className={cmp.section} aria-labelledby="method-h">
            <h2 className={cmp.h2} id="method-h">
              How to use it
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

          <section className={cmp.section} aria-labelledby="allowance-faq-h">
            <h2 className={cmp.h2} id="allowance-faq-h">
              Common questions
            </h2>
            <div className={cmp.faqList}>
              {FAQ.map((f, i) => (
                <details
                  key={f.q}
                  className={cmp.faq}
                  open={i === 0}
                  name="allowance-faq"
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
            <h2 className={cmp.ctaTitle}>Skip the cash — reward with points</h2>
            <p className={cmp.ctaText}>
              Pointsy turns chores into points kids redeem for the rewards you
              set — free, private, and no card or bank account needed.
            </p>
            <a className={cmp.ctaBtn} href="/sign-up">
              Create your family — it’s free
              <ArrowRight size={18} aria-hidden="true" />
            </a>
            <div className={cmp.crossLinks}>
              <Link href="/tools/reward-calculator">
                <Calculator size={16} aria-hidden="true" /> Reward calculator
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
