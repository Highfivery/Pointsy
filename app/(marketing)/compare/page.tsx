import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, ChevronDown, ArrowRight } from "lucide-react";
import {
  ROWS,
  PROVIDERS,
  COMPARISONS,
  type RowKey,
} from "@/lib/marketing/comparisons";
import styles from "@/components/marketing/comparison.module.css";

const SITE_URL = "https://pointsy.kids";

export const metadata: Metadata = {
  title: "Best Free Chore & Reward Apps With No Credit Card (2026)",
  description:
    "Compare Pointsy with Greenlight, Acorns Early, BusyKid and FamZoo. The free, points-based, no-credit-card way to reward kids for chores — side by side.",
  alternates: { canonical: "/compare" },
};

// A curated, scannable subset of rows for the at-a-glance hub table.
const HUB_ROWS: RowKey[] = [
  "price",
  "freeTier",
  "card",
  "earn",
  "age",
  "install",
];
const HUB_PROVIDERS = ["greenlight", "acornsEarly", "busykid", "famzoo"];

const HUB_FAQ = [
  {
    q: "What's the best free chore app with no credit card?",
    a: "Pointsy is a free, points-based chore and reward app with no credit card, no bank account and no subscription. Kids earn points for chores and redeem them for rewards you set. Most alternatives (Greenlight, Acorns Early, BusyKid, FamZoo) are paid apps built around a real-money card.",
  },
  {
    q: "Why use points instead of real money?",
    a: "Points work at any age, need no bank account or ID, and can be redeemed for anything you choose — screen time, outings, privileges, or items. There's nothing to fund and nothing for a child to spend by accident.",
  },
  {
    q: "Is Pointsy really free?",
    a: "Yes — every feature, for every family, with no ads and no subscription. Pointsy is open-source (MIT), which is also why it stays free.",
  },
];

export default function CompareHub() {
  const rows = ROWS.filter((r) => HUB_ROWS.includes(r.key));
  const cols = HUB_PROVIDERS.map((k) => PROVIDERS[k]);
  const details = Object.values(COMPARISONS);

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Compare",
        item: `${SITE_URL}/compare`,
      },
    ],
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: HUB_FAQ.map((f) => ({
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
      <main id="main" className={styles.main}>
        <div className={styles.inner}>
          <nav className={styles.crumb} aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <ChevronRight size={14} aria-hidden="true" />
            <span aria-current="page">Compare</span>
          </nav>

          <header className={styles.hero}>
            <p className={styles.eyebrow}>Compare · 2026</p>
            <h1 className={styles.h1}>
              The best free chore &amp; reward apps with{" "}
              <span className={styles.grad}>no credit card</span>
            </h1>
            <p className={styles.lede}>
              Most popular kids&rsquo; chore apps are paid services built around
              a real-money credit card. Pointsy is the free, points-based
              option: kids earn points for chores and redeem them for rewards
              you set — with no card, no bank account, and no app-store
              download. Here&rsquo;s how it compares.
            </p>
          </header>

          <section className={styles.section} aria-labelledby="hub-table-h">
            <h2 className={styles.h2} id="hub-table-h">
              At a glance
            </h2>
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">
                      <span className="sr-only">Feature</span>
                    </th>
                    <th scope="col" className={styles.colHi}>
                      Pointsy
                    </th>
                    {cols.map((c) => (
                      <th scope="col" key={c.name} className={styles.colOther}>
                        {c.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.key}>
                      <th scope="row">{row.label}</th>
                      <td className={styles.colHi}>{row.pointsy}</td>
                      {cols.map((c) => (
                        <td key={c.name} className={styles.colOther}>
                          {c.values[row.key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className={styles.sourceNote}>
              Pricing and features per each provider&rsquo;s site, 2026.
              GoHenry&rsquo;s US service became Acorns Early in late 2025.
              Figures change — check each provider for current pricing.
            </p>
          </section>

          <section className={styles.section} aria-labelledby="hub-detail-h">
            <h2 className={styles.h2} id="hub-detail-h">
              Side-by-side comparisons
            </h2>
            <ul className={styles.hubCards}>
              {details.map((d) => (
                <li key={d.slug}>
                  <Link href={`/compare/${d.slug}`} className={styles.hubCard}>
                    <span className={styles.hubCardTitle}>
                      Pointsy vs {d.shortName}
                    </span>
                    <span className={styles.hubCardText}>{d.tldr}</span>
                    <span className={styles.hubCardCta}>
                      Read the comparison
                      <ArrowRight size={16} aria-hidden="true" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section
            className={`${styles.section} ${styles.faqBlock}`}
            aria-labelledby="hub-faq-h"
          >
            <h2 className={styles.h2} id="hub-faq-h">
              Frequently asked
            </h2>
            <div className={styles.faqList}>
              {HUB_FAQ.map((f, i) => (
                <details
                  key={f.q}
                  className={styles.faq}
                  open={i === 0}
                  name="hub-faq"
                >
                  <summary className={styles.faqQ}>
                    {f.q}
                    <ChevronDown
                      size={20}
                      aria-hidden="true"
                      className={styles.faqChev}
                    />
                  </summary>
                  <p className={styles.faqA}>{f.a}</p>
                </details>
              ))}
            </div>
          </section>

          <section className={styles.cta}>
            <h2 className={styles.ctaTitle}>
              Start free — no card, no app store
            </h2>
            <p className={styles.ctaText}>
              Set up your family in a few minutes and turn chores into points
              kids redeem for the rewards you choose.
            </p>
            <a className={styles.ctaBtn} href="/sign-up">
              Create your family — it&rsquo;s free
              <ArrowRight size={18} aria-hidden="true" />
            </a>
          </section>
        </div>
      </main>
    </>
  );
}
