import Link from "next/link";
import {
  ChevronRight,
  ChevronDown,
  Sparkles,
  Scale,
  Check,
  ArrowRight,
  Calculator,
} from "lucide-react";
import { ROWS, PROVIDERS, type Comparison } from "@/lib/marketing/comparisons";
import styles from "./comparison.module.css";

export function ComparisonView({ data }: { data: Comparison }) {
  const cols = data.providers.map((key) => PROVIDERS[key]);

  return (
    <main id="main" className={styles.main}>
      <div className={styles.inner}>
        <nav className={styles.crumb} aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <ChevronRight size={14} aria-hidden="true" />
          <Link href="/compare">Compare</Link>
          <ChevronRight size={14} aria-hidden="true" />
          <span aria-current="page">{data.shortName}</span>
        </nav>

        <header className={styles.hero}>
          <p className={styles.eyebrow}>Comparison · updated 2026</p>
          <h1 className={styles.h1}>
            {data.h1.lead}{" "}
            <span className={styles.grad}>{data.h1.highlight}</span>{" "}
            {data.h1.tail}
          </h1>
          <p className={styles.lede}>{data.lede}</p>

          <aside className={styles.tldr}>
            <Sparkles
              size={20}
              aria-hidden="true"
              className={styles.tldrIcon}
            />
            <p>
              <strong>Short answer:</strong> {data.tldr}
            </p>
          </aside>
        </header>

        {/* Comparison table */}
        <section className={styles.section} aria-labelledby="table-h">
          <h2 className={styles.h2} id="table-h">
            Pointsy vs {data.shortName}
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
                {ROWS.map((row) => (
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
            Pricing and features per each provider’s site, 2026. GoHenry’s US
            service became Acorns Early in late 2025. Figures change — check
            each provider for current pricing.
          </p>
        </section>

        {/* Why switch */}
        <section className={styles.section} aria-labelledby="why-h">
          <h2 className={styles.h2} id="why-h">
            Why families look for a free, no-card option
          </h2>
          <ul className={styles.reasons}>
            {data.painPoints.map((p) => (
              <li key={p.title} className={styles.reason}>
                <Check
                  size={18}
                  aria-hidden="true"
                  className={styles.reasonIcon}
                />
                <span>
                  <strong>{p.title}</strong>
                  {p.text}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Honest balance */}
        <section className={styles.balance} aria-labelledby="balance-h">
          <Scale size={22} aria-hidden="true" className={styles.balanceIcon} />
          <div>
            <h2 className={styles.balanceTitle} id="balance-h">
              When a credit-card app is the better choice
            </h2>
            {data.balance.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section
          className={`${styles.section} ${styles.faqBlock}`}
          aria-labelledby="faq-h"
        >
          <h2 className={styles.h2} id="faq-h">
            Frequently asked
          </h2>
          <div className={styles.faqList}>
            {data.faqs.map((f, i) => (
              <details
                key={f.q}
                className={styles.faq}
                open={i === 0}
                name="compare-faq"
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

        {/* CTA + cross-links */}
        <section className={styles.cta}>
          <h2 className={styles.ctaTitle}>Try the free alternative</h2>
          <p className={styles.ctaText}>
            Set up your family in a few minutes — free forever, no card, no app
            store.
          </p>
          <a className={styles.ctaBtn} href="/sign-up">
            Create your family — it’s free
            <ArrowRight size={18} aria-hidden="true" />
          </a>
          <div className={styles.crossLinks}>
            <Link href="/compare">
              <Scale size={16} aria-hidden="true" /> See all comparisons
            </Link>
            <Link href="/tools/reward-calculator">
              <Calculator size={16} aria-hidden="true" /> Reward calculator
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
