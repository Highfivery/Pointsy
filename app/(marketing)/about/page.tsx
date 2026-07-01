import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronRight,
  ArrowRight,
  Check,
  ShieldCheck,
  Code2,
  Globe,
} from "lucide-react";
import cmp from "@/components/marketing/comparison.module.css";
import a from "@/components/marketing/about.module.css";

const SITE_URL = "https://pointsy.kids";
const REPO = "https://github.com/Highfivery/Pointsy";

export const metadata: Metadata = {
  title: "About Pointsy — free, private chore rewards for families",
  description:
    "Pointsy is a free, open-source, privacy-first app that turns chores into points kids redeem for rewards — no subscription, no credit card, no data selling. Made by Highfivery LLC.",
  alternates: { canonical: "/about" },
};

const VALUES = [
  {
    Icon: Check,
    title: "Free, for every family",
    text: "Every feature, no subscriptions, no ads, nothing to buy. Being open-source is what keeps it that way.",
  },
  {
    Icon: ShieldCheck,
    title: "Private by design",
    text: "Kids are just a name, an avatar and a PIN. No kid emails, no tracking, no selling data — ever.",
  },
  {
    Icon: Code2,
    title: "Open & honest",
    text: "The whole app is open-source under the MIT license. No dark patterns, no hidden fees, no lock-in.",
  },
  {
    Icon: Globe,
    title: "For everyone",
    text: "Built to meet WCAG 2.1 AA, works on any device, and has no minimum age. Chores are universal.",
  },
];

const PROMISE = [
  {
    title: "Only parents have accounts.",
    text: "No kid emails or contact info.",
  },
  { title: "No ads, no trackers.", text: "We never sell or share your data." },
  { title: "No real money.", text: "Points only — no card, no bank link." },
  { title: "Export & delete anytime.", text: "Your family, your data." },
];

export default function AboutPage() {
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "About",
        item: `${SITE_URL}/about`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <main id="main" className={cmp.main}>
        <div className={cmp.inner}>
          <nav className={cmp.crumb} aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <ChevronRight size={14} aria-hidden="true" />
            <span aria-current="page">About</span>
          </nav>

          <header className={cmp.hero}>
            <p className={cmp.eyebrow}>About</p>
            <h1 className={cmp.h1}>
              A free, private way to make chores{" "}
              <span className={cmp.grad}>rewarding</span>
            </h1>
            <p className={cmp.lede}>
              Pointsy is a small, independent app with one job: help families
              turn chores into points kids actually want to earn — without a
              subscription, a credit card, or your data.
            </p>
          </header>

          {/* Mission */}
          <section className={cmp.section} aria-labelledby="mission-h">
            <div className={a.mission}>
              <h2 className={cmp.h2} id="mission-h">
                Why we built it
              </h2>
              <p>
                We kept running into the same thing: every “kids money” app
                wanted a monthly fee, a bank link, and a credit card — just to
                reward a few chores around the house. For a lot of families,
                that’s far more than they need, and more of their kids’ data
                than they’re comfortable handing over.
              </p>
              <blockquote className={a.pull}>
                <p>
                  Rewarding your kids shouldn’t require a subscription, a bank
                  account, or handing over their data.
                </p>
              </blockquote>
              <p>
                So we made <strong>Pointsy</strong>: points instead of real
                money, nothing to install from an app store, and privacy built
                in from the start. And we made it <strong>open-source</strong>,
                so it can stay free and anyone can see exactly how it works.
              </p>
            </div>
          </section>

          {/* Values */}
          <section className={cmp.section} aria-labelledby="believe-h">
            <h2 className={cmp.h2} id="believe-h">
              What we believe
            </h2>
            <ul className={a.values}>
              {VALUES.map(({ Icon, title, text }) => (
                <li key={title} className={a.value}>
                  <span className={a.valueIcon}>
                    <Icon size={22} aria-hidden="true" />
                  </span>
                  <span>
                    <strong>{title}</strong>
                    <p>{text}</p>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* How it stays free + who's behind it */}
          <section
            className={cmp.section}
            aria-label="How Pointsy stays free and who makes it"
          >
            <div className={a.twoup}>
              <div className={a.panel}>
                <h2 className={a.panelTitle}>How Pointsy stays free</h2>
                <p>
                  There’s no subscription and no ads because there’s nothing to
                  monetize — we don’t sell data and we don’t take a cut of
                  anything.
                </p>
                <p>
                  Pointsy is <strong>open-source (MIT)</strong>: the code is
                  public, families can self-host it for free, and contributors
                  help make it better. That’s the model that keeps it free for
                  good.
                </p>
                <p>
                  <a href={REPO} target="_blank" rel="noreferrer">
                    View Pointsy on GitHub →
                  </a>
                </p>
              </div>
              <div className={a.panel}>
                <h2 className={a.panelTitle}>Who’s behind it</h2>
                <p>
                  Pointsy is made by <strong>Highfivery LLC</strong>, a small
                  independent software studio in Texas, USA. It’s built in the
                  open with help from a community of contributors.
                </p>
                <p>
                  Questions, ideas, or feedback? We’d love to hear from you.
                </p>
                <p>
                  <a href="mailto:info@highfivery.com">info@highfivery.com</a>
                </p>
              </div>
            </div>
          </section>

          {/* Privacy promise */}
          <section className={cmp.section} aria-labelledby="promise-h">
            <div className={a.promise}>
              <h2 className={cmp.h2} id="promise-h">
                Our privacy promise
              </h2>
              <p className={a.promiseText}>
                Pointsy is built around children’s-data minimization and aligned
                with COPPA and GDPR-K. In plain terms:
              </p>
              <ul className={a.plist}>
                {PROMISE.map((p) => (
                  <li key={p.title}>
                    <Check size={18} aria-hidden="true" />
                    <span>
                      <strong>{p.title}</strong> {p.text}
                    </span>
                  </li>
                ))}
              </ul>
              <p className={a.promiseLink}>
                <Link href="/privacy">Read the full Privacy Policy →</Link>
              </p>
            </div>
          </section>

          <section className={cmp.cta}>
            <h2 className={cmp.ctaTitle}>Give it a try — it’s free</h2>
            <p className={cmp.ctaText}>
              Set up your family in a few minutes. No card, no app store, no
              catch.
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
