import {
  Sparkles,
  ArrowRight,
  UsersRound,
  Mail,
  ChevronRight,
  Gift,
  EyeOff,
  GitFork,
  Star,
  GitPullRequest,
} from "lucide-react";
import { getKnownFamily } from "@/lib/auth/device";
import { PickerScreen } from "@/components/enter/PickerScreen";
import { InstallBanner } from "@/components/pwa/InstallBanner";
import { Logo } from "@/components/brand/Logo";
import styles from "./page.module.css";

const REPO = "https://github.com/Highfivery/Pointsy";

const STEPS = [
  {
    title: "Set up your family",
    text: "Add your kids and a few chores and rewards. It takes under a minute.",
  },
  {
    title: "Award points",
    text: "Tap a chore when it’s done — or let kids log their own for you to approve.",
  },
  {
    title: "Kids redeem rewards",
    text: "They spend points on rewards you’ve set. Everyone sees the balance.",
  },
];

const FAQ = [
  {
    q: "Is Pointsy really free?",
    a: "Yes — 100% free, every feature, for every family. No ads, no subscriptions, nothing to buy. Pointsy is open-source, so it always will be.",
  },
  {
    q: "Is my kids’ data safe?",
    a: "Yes. Kids aren’t tracked and have no email — just a name, avatar, and PIN you set. No ads, no analytics, no selling data. Pointsy is built around children’s-data minimization (COPPA and GDPR-K).",
  },
  {
    q: "Do I need to install anything?",
    a: "No. Pointsy runs in your browser, and you can add it to your home screen in a couple of taps — no App Store, no download.",
  },
  {
    q: "Can I add more than one kid or parent?",
    a: "Yes — add as many kids as you like, and invite a co-parent to share the same dashboard.",
  },
  {
    q: "Is Pointsy open-source?",
    a: "Yes, under the MIT license. Anyone can use it, fork it, self-host it for free, or contribute on GitHub.",
  },
];

export default async function Home() {
  // A device that's already used Pointsy goes straight to its family's profile
  // picker (PIN required) — never the marketing page or a sign-in form.
  const family = await getKnownFamily();
  if (family) return <PickerScreen initialFamily={family} />;

  const appLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Pointsy",
    url: "https://pointsy.kids",
    description:
      "A free, open-source family chores app. Parents reward good habits with points; kids redeem them for rewards.",
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Web, iOS, Android (PWA)",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    author: {
      "@type": "Organization",
      name: "Highfivery LLC",
      url: "https://highfivery.com",
    },
    license: "https://opensource.org/licenses/MIT",
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
    <main id="main" className={styles.main}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <InstallBanner />

      <section className={styles.hero}>
        <Logo size={30} />
        <p className={styles.badge}>
          <Sparkles size={16} aria-hidden="true" />
          <span>Chores, minus the nagging</span>
        </p>
        <h1 className={styles.title}>Points that make chores fun.</h1>
        <p className={styles.subtitle}>
          Reward good habits with a tap. Your kids watch their points grow and
          spend them on rewards you set.
        </p>
        <div className={styles.actions}>
          <a className={styles.primary} href="/sign-up">
            Create your family
            <ArrowRight size={18} aria-hidden="true" />
          </a>
          <a className={styles.secondary} href="/sign-in">
            Parent sign in
          </a>
        </div>
        <p className={styles.heroNote}>
          Free forever · No ads · Private by design
        </p>
      </section>

      <section className={styles.section} aria-labelledby="how-heading">
        <p className={styles.eyebrow} id="how-heading">
          How it works
        </p>
        <ol className={styles.steps}>
          {STEPS.map((s, i) => (
            <li key={s.title} className={styles.step}>
              <span className={styles.stepNum}>{i + 1}</span>
              <span className={styles.stepBody}>
                <span className={styles.stepTitle}>{s.title}</span>
                <span className={styles.stepText}>{s.text}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.section} aria-labelledby="grow-heading">
        <h2 className={styles.sectionTitle} id="grow-heading">
          Kids watch it grow.
        </h2>
        <p className={styles.sectionLead}>Big, friendly numbers — no jargon.</p>
        <div className={styles.preview}>
          <span className={styles.ring} aria-hidden="true">
            <svg width="56" height="56" viewBox="0 0 56 56">
              <circle
                cx="28"
                cy="28"
                r="23"
                fill="none"
                stroke="#103128"
                strokeWidth="6"
              />
              <circle
                cx="28"
                cy="28"
                r="23"
                fill="none"
                stroke="#34d399"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray="108 145"
                transform="rotate(-90 28 28)"
              />
            </svg>
            <span className={styles.ringNum}>240</span>
          </span>
          <span className={styles.previewText}>
            <span className={styles.previewName}>Ava’s points</span>
            <span className={styles.previewEvent}>
              +10 · Cleaned her room 🎉
            </span>
          </span>
        </div>
      </section>

      <section
        className={`${styles.section} ${styles.open}`}
        aria-labelledby="open-heading"
      >
        <p className={styles.eyebrow}>Free &amp; open</p>
        <h2 className={styles.sectionTitle} id="open-heading">
          Free forever. Built in the open.
        </h2>
        <p className={styles.sectionLead}>
          Every feature, no ads, no subscriptions — Pointsy is 100% free. A
          family runs on relationships; we just make the everyday stuff fun.
        </p>
        <ul className={styles.openList}>
          <li>
            <Gift size={18} aria-hidden="true" />
            100% free — every feature, for every family
          </li>
          <li>
            <EyeOff size={18} aria-hidden="true" />
            No ads, no tracking, nothing to sell
          </li>
          <li>
            <GitFork size={18} aria-hidden="true" />
            Open-source (MIT) — fork it, self-host it, improve it
          </li>
        </ul>
        <p className={styles.sectionLead}>
          Sharing is caring. Pointsy is built in the open and made better by
          families like yours — ideas, bug reports, and code all welcome.
        </p>
        <div className={styles.openCtas}>
          <a
            className={styles.ghostBtn}
            href={REPO}
            target="_blank"
            rel="noreferrer"
          >
            <Star size={16} aria-hidden="true" />
            Star on GitHub
          </a>
          <a
            className={styles.ghostBtn}
            href={`${REPO}/pulls`}
            target="_blank"
            rel="noreferrer"
          >
            <GitPullRequest size={16} aria-hidden="true" />
            Contribute
          </a>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="faq-heading">
        <p className={styles.eyebrow} id="faq-heading">
          Questions
        </p>
        <dl className={styles.faq}>
          {FAQ.map((f) => (
            <div key={f.q} className={styles.faqItem}>
              <dt className={styles.faqQ}>{f.q}</dt>
              <dd className={styles.faqA}>{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={styles.section} aria-labelledby="join-heading">
        <p className={styles.eyebrow} id="join-heading">
          Already part of a family?
        </p>
        <ul className={styles.joinList}>
          <li>
            <a href="/enter" className={styles.joinLink}>
              <span className={styles.joinIcon}>
                <UsersRound size={22} aria-hidden="true" />
              </span>
              <span className={styles.joinText}>
                <span className={styles.joinLabel}>Kids &amp; family</span>
                <span className={styles.joinHint}>Enter your family code</span>
              </span>
              <ChevronRight
                size={20}
                aria-hidden="true"
                className={styles.joinChevron}
              />
            </a>
          </li>
          <li>
            <a href="/join" className={styles.joinLink}>
              <span className={styles.joinIcon}>
                <Mail size={22} aria-hidden="true" />
              </span>
              <span className={styles.joinText}>
                <span className={styles.joinLabel}>
                  Invited as a co-parent?
                </span>
                <span className={styles.joinHint}>Enter your invite code</span>
              </span>
              <ChevronRight
                size={20}
                aria-hidden="true"
                className={styles.joinChevron}
              />
            </a>
          </li>
        </ul>
      </section>
    </main>
  );
}
