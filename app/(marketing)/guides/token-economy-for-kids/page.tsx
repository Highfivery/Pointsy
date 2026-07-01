import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronRight,
  ChevronDown,
  ArrowRight,
  Zap,
  TrendingUp,
  ClipboardCheck,
  AlertTriangle,
  Gift,
  ListChecks,
} from "lucide-react";
import cmp from "@/components/marketing/comparison.module.css";
import t from "@/components/marketing/token-economy.module.css";

const SITE_URL = "https://pointsy.kids";

export const metadata: Metadata = {
  title: "Token Economy for Kids: A Simple Guide (2026)",
  description:
    "What a token economy is, why it works, and how to set one up for your kids in 5 steps — with points, stars or cash compared. A plain-language parent's guide.",
  alternates: { canonical: "/guides/token-economy-for-kids" },
};

const WHY = [
  {
    Icon: Zap,
    title: "Immediate reinforcement",
    text: "Rewarding the moment a chore is done links effort to reward — the core of how habits form.",
  },
  {
    Icon: TrendingUp,
    title: "Visible progress",
    text: "A balance that grows is motivating on its own. Kids can see themselves getting closer to a goal.",
  },
  {
    Icon: ClipboardCheck,
    title: "Clear expectations",
    text: "Everyone knows what earns what. Fewer arguments, less nagging, no moving goalposts.",
  },
];

const TOKENS = [
  {
    token: "Points",
    tag: "Pointsy",
    bestFor: "Any age, any reward",
    catch: "Digital — needs an app like Pointsy (free)",
    hl: true,
  },
  {
    token: "Stars / stickers",
    bestFor: "Young kids",
    catch: "Physical charts don’t scale to multiple kids or bigger rewards",
    hl: false,
  },
  {
    token: "Cash",
    bestFor: "Teens",
    catch: "Real money means a card or bank, fees, and an age floor",
    hl: false,
  },
];

const FAQ = [
  {
    q: "What is a token economy in simple terms?",
    a: "It’s a system where kids earn tokens for doing the right thing and trade them for rewards. Pointsy uses points as the tokens, so there’s no cash or chart to manage.",
  },
  {
    q: "What age does a token economy work for?",
    a: "Any age — toddlers to teens. Younger kids respond to the instant reward; older kids like saving toward bigger goals. Because Pointsy uses points, there’s no minimum age.",
  },
  {
    q: "Are token economies actually effective?",
    a: "Yes — they’re among the most studied behaviour tools, used by parents, teachers and therapists alike. They work best when tokens are awarded consistently and right away.",
  },
  {
    q: "Token economy vs sticker chart — what’s the difference?",
    a: "A sticker chart is a simple token economy. Digital points scale better: nothing to reprint, it works across multiple kids, and rewards can cost any amount.",
  },
];

export default function TokenEconomyPage() {
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Guides",
        item: `${SITE_URL}/guides/token-economy-for-kids`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Token economy for kids",
        item: `${SITE_URL}/guides/token-economy-for-kids`,
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
            <span aria-current="page">Token economy for kids</span>
          </nav>

          <header className={cmp.hero}>
            <p className={cmp.eyebrow}>Guide · updated 2026</p>
            <h1 className={cmp.h1}>
              Token economy for kids: a{" "}
              <span className={cmp.grad}>simple guide</span>
            </h1>
            <p className={cmp.lede}>
              If you’ve ever used a sticker chart, you’ve run a token economy.
              Here’s what it is, why it works, and how to set one up that
              actually sticks.
            </p>
            <div className={t.define}>
              <p className={t.defineLabel}>Definition</p>
              <p>
                A <strong>token economy</strong> is a reward system where
                children earn tokens — points, stars, or stickers — for chores
                or good behaviour, then exchange them for rewards you set.
                Backed by decades of behavioural research, it’s a simple way to
                build habits and cut down on nagging. Pointsy is a token economy
                that uses <strong>points</strong> as the tokens.
              </p>
            </div>
          </header>

          {/* How to set up */}
          <section className={cmp.section} aria-labelledby="setup-h">
            <h2 className={cmp.h2} id="setup-h">
              How to set up a token economy
            </h2>
            <p className={t.sectionLead}>
              Five steps — you can have one running in a few minutes.
            </p>
            <ol className={t.steps}>
              <li>
                <div>
                  <strong>Choose 2–3 behaviours to reward.</strong>
                  <p>
                    Start small — a couple of chores or habits — so it’s easy to
                    stay consistent.
                  </p>
                </div>
              </li>
              <li>
                <div>
                  <strong>Pick your token.</strong>
                  <p>
                    Points work best: they scale to any age, don’t get lost like
                    stickers, and can be any value.
                  </p>
                </div>
              </li>
              <li>
                <div>
                  <strong>Set what things are worth.</strong>
                  <p>
                    Decide how many tokens each chore earns and what each reward
                    costs.{" "}
                    <Link href="/tools/reward-calculator">
                      The calculators do this math
                    </Link>
                    .
                  </p>
                </div>
              </li>
              <li>
                <div>
                  <strong>Award tokens right away, every time.</strong>
                  <p>
                    Immediate, consistent rewards are what make it work — this
                    is the step families skip.
                  </p>
                </div>
              </li>
              <li>
                <div>
                  <strong>Let them redeem for rewards they want.</strong>
                  <p>
                    Screen time, an outing, a treat — rewards they care about
                    keep them motivated.
                  </p>
                </div>
              </li>
            </ol>
          </section>

          {/* Why it works */}
          <section className={cmp.section} aria-labelledby="why-h">
            <h2 className={cmp.h2} id="why-h">
              Why token economies work
            </h2>
            <ul className={t.cards}>
              {WHY.map(({ Icon, title, text }) => (
                <li key={title} className={t.card}>
                  <span className={t.cardIcon}>
                    <Icon size={22} aria-hidden="true" />
                  </span>
                  <strong>{title}</strong>
                  <p>{text}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* Token types */}
          <section className={cmp.section} aria-labelledby="tokens-h">
            <h2 className={cmp.h2} id="tokens-h">
              Points, stars, or cash?
            </h2>
            <p className={t.sectionLead}>
              The three common tokens — and why points scale best.
            </p>
            <div className={t.tableWrap}>
              <table className={t.table}>
                <thead>
                  <tr>
                    <th scope="col">Token</th>
                    <th scope="col">Best for</th>
                    <th scope="col">The catch</th>
                  </tr>
                </thead>
                <tbody>
                  {TOKENS.map((row) => (
                    <tr key={row.token} className={row.hl ? t.hl : undefined}>
                      <th scope="row">
                        {row.token}
                        {row.tag ? (
                          <span className={t.tag}>{row.tag}</span>
                        ) : null}
                      </th>
                      <td data-label="Best for">{row.bestFor}</td>
                      <td data-label="The catch">{row.catch}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Common mistakes */}
          <section className={cmp.section} aria-labelledby="mistakes-h">
            <h2 className={cmp.h2} id="mistakes-h">
              Common mistakes to avoid
            </h2>
            <ul className={t.mistakes}>
              <li className={t.mistake}>
                <AlertTriangle size={20} aria-hidden="true" />
                <div>
                  <strong>Too many behaviours at once</strong>
                  <p>Start with 2–3 and add more as the habit sticks.</p>
                </div>
              </li>
              <li className={t.mistake}>
                <AlertTriangle size={20} aria-hidden="true" />
                <div>
                  <strong>Awarding inconsistently</strong>
                  <p>
                    Tokens only work if they come every time — not when you
                    remember.
                  </p>
                </div>
              </li>
              <li className={t.mistake}>
                <AlertTriangle size={20} aria-hidden="true" />
                <div>
                  <strong>Rewards priced wrong</strong>
                  <p>
                    Too cheap and there’s no pull; too dear and they give up.{" "}
                    <Link href="/tools/reward-calculator">
                      Use the calculator
                    </Link>
                    .
                  </p>
                </div>
              </li>
              <li className={t.mistake}>
                <AlertTriangle size={20} aria-hidden="true" />
                <div>
                  <strong>Only focusing on the negative</strong>
                  <p>
                    Catch good behaviour and reward it — that’s what a token
                    economy is for.
                  </p>
                </div>
              </li>
            </ul>
          </section>

          {/* Tie-in */}
          <section className={cmp.section} aria-labelledby="tiein-h">
            <div className={t.tiein}>
              <h2 className={t.tieinTitle} id="tiein-h">
                Pointsy is a token economy, ready to go
              </h2>
              <p className={t.tieinText}>
                Points as tokens, PIN-gated kid profiles, a reward menu you
                control, and parent approval on every redemption — the whole
                system, set up in a minute and free forever.
              </p>
              <a className={cmp.ctaBtn} href="/sign-up">
                Create your family — it’s free
                <ArrowRight size={18} aria-hidden="true" />
              </a>
              <div className={t.tieinLinks}>
                <Link href="/tools/reward-calculator">
                  <Gift size={16} aria-hidden="true" /> Reward calculator
                </Link>
                <Link href="/guides/age-appropriate-chores">
                  <ListChecks size={16} aria-hidden="true" /> Chores by age
                </Link>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section
            className={`${cmp.section} ${cmp.faqBlock}`}
            aria-labelledby="token-faq-h"
          >
            <h2 className={cmp.h2} id="token-faq-h">
              Common questions
            </h2>
            <div className={cmp.faqList}>
              {FAQ.map((f, i) => (
                <details
                  key={f.q}
                  className={cmp.faq}
                  open={i === 0}
                  name="token-faq"
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
            <h2 className={cmp.ctaTitle}>Start your token economy free</h2>
            <p className={cmp.ctaText}>
              Set up chores, points and rewards in a minute — no card, no app
              store, private by design.
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
