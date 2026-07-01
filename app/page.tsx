import Image from "next/image";
import {
  Sparkles,
  ArrowRight,
  Check,
  CreditCard,
  ShieldCheck,
  Globe,
  ListChecks,
  ClipboardCheck,
  Gift,
  Trophy,
  Users,
  BadgeCheck,
  EyeOff,
  Download,
  ChevronDown,
} from "lucide-react";
import { getKnownFamily } from "@/lib/auth/device";
import { PickerScreen } from "@/components/enter/PickerScreen";
import { InstallBanner } from "@/components/pwa/InstallBanner";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { SiteFooter } from "@/components/ui/SiteFooter";
import styles from "./page.module.css";

// Product screenshots live in /public and are referenced by path (the standard
// for public assets — avoids a build-time static image import).
const parentDash = "/screens/parent-dashboard.png";
const kidHome = "/screens/kid-home.png";
const challengesShot = "/screens/challenges.png";
const kidRedeem = "/screens/kid-redeem.png";
// Intrinsic size of the phone captures (used for aspect ratio on non-fill images).
const PHONE_W = 1170;
const PHONE_H = 2532;

const STEPS = [
  {
    title: "Set up your family",
    text: "Add your kids with an avatar and a 4-digit PIN, then pick from starter chores and rewards — or make your own. Under a minute.",
  },
  {
    title: "Award points for chores",
    text: "Tap a chore to award points, or let kids log their own for you to approve. Rotations, daily limits and checklists keep it fair.",
  },
  {
    title: "Kids redeem rewards",
    text: "Kids spend points on the rewards you set. You approve each one — so nothing’s spent by accident, and every point is tracked.",
  },
];

const COMPARE = [
  { label: "Price", pointsy: "Free, forever", others: "$4–$20 / month" },
  {
    label: "What kids earn",
    pointsy: "Points & rewards you set",
    others: "Real money on a card",
  },
  {
    label: "Bank account / ID",
    pointsy: "Never needed",
    others: "Required (KYC)",
  },
  {
    label: "Getting it",
    pointsy: "Any browser · add to home screen",
    others: "App Store download",
  },
  { label: "Works for ages", pointsy: "Any age", others: "Usually 6+" },
  {
    label: "Your data",
    pointsy: "Nothing sold · no ad tracking",
    others: "Financial profile built",
  },
];

const FEATURES = [
  {
    Icon: ListChecks,
    title: "Smart chore catalog",
    text: "Categories, ~200 icons, daily/weekly limits, core chores, and take-turns rotation between kids.",
  },
  {
    Icon: ClipboardCheck,
    title: "Kid-logged & approved",
    text: "Break chores into steps. Kids log their own, and you approve them from a tidy queue.",
  },
  {
    Icon: Gift,
    title: "Rewards & safe redemptions",
    text: "Points are held while a request is pending; you approve, then mark it delivered. Overdrawn kids can’t redeem.",
  },
  {
    Icon: Trophy,
    title: "Challenges & streaks",
    text: "Time-boxed goals that pay a bonus — per-kid or whole-family, with optional weekly repeat.",
  },
  {
    Icon: Users,
    title: "Team-up rewards",
    text: "Kids pool points for a shared reward, splitting the cost evenly — with one parent approval.",
  },
  {
    Icon: BadgeCheck,
    title: "Points you can trust",
    text: "Balances come from an append-only ledger — they can never silently drift, and every change is auditable.",
  },
];

const PRIVACY = [
  {
    Icon: Users,
    title: "Only parents have accounts.",
    text: "No kid email, no contact info, no behavioural tracking on children.",
  },
  {
    Icon: EyeOff,
    title: "No ads, no selling data.",
    text: "Ever. There’s nothing to monetize and no third-party trackers.",
  },
  {
    Icon: CreditCard,
    title: "No real money involved.",
    text: "Points only — no card, no bank link, nothing to steal.",
  },
  {
    Icon: Download,
    title: "Export & erase anytime.",
    text: "Export your family’s data, or delete the whole family in one action.",
  },
];

const FAQ = [
  {
    q: "Is Pointsy really free?",
    a: "Yes — 100% free, every feature, for every family. No ads, no subscriptions, nothing to buy. Pointsy is open-source, so it always will be.",
  },
  {
    q: "Does it use real money or a credit card?",
    a: "No. Pointsy uses points, not dollars — there’s no card, no bank link, and no money moving anywhere. You decide what points are worth and which rewards they buy.",
  },
  {
    q: "What ages is it for?",
    a: "Any age. Because there’s no card or bank account, there’s no minimum age — set chores and rewards to match your child, from toddlers to teens.",
  },
  {
    q: "Do I need to install anything?",
    a: "No. Pointsy runs in your browser, and you can add it to your home screen in a couple of taps — no App Store, no download, works on any phone, tablet or computer.",
  },
  {
    q: "Is my kids’ data safe?",
    a: "Yes. Kids aren’t tracked and have no email — just a name, avatar, and PIN you set. No ads, no analytics, no selling data. Pointsy is built around children’s-data minimization (COPPA and GDPR-K).",
  },
  {
    q: "Can I add more than one kid or parent?",
    a: "Yes — add as many kids as you like, and invite a co-parent with a one-time code to share the same dashboard. No extra cost.",
  },
  {
    q: "Is Pointsy open-source?",
    a: "Yes, under the MIT license. Anyone can use it, fork it, self-host it for free, or contribute on GitHub — which is also why we can promise it’ll stay free.",
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
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <InstallBanner />
      <SiteHeader />

      <main id="main" className={styles.main}>
        {/* ----------------------------------------------------------- hero --- */}
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>
              <Sparkles size={15} aria-hidden="true" />
              Free forever · No app store · Private by design
            </p>
            <h1 className={styles.title}>
              Chores your kids{" "}
              <span className={styles.grad}>actually want</span> to do.
            </h1>
            <p className={styles.lede}>
              Pointsy turns everyday chores into points your kids earn and spend
              on rewards <em>you</em> choose. No allowance to fund, no credit
              card, no app to download — just good habits, made fun.
            </p>
            <div className={styles.actions}>
              <a className={styles.primary} href="/sign-up">
                Create your family — it’s free
                <ArrowRight size={18} aria-hidden="true" />
              </a>
              <a className={styles.secondary} href="#how">
                See how it works
              </a>
            </div>
            <p className={styles.heroNote}>
              <Check size={16} aria-hidden="true" />
              Works on any phone — add it to the home screen in two taps. No App
              Store, no credit card.
            </p>
          </div>
          <div className={styles.phones} aria-hidden="true">
            <div className={styles.glow} />
            <div className={`${styles.phone} ${styles.phoneBack}`}>
              <Image
                src={parentDash}
                alt=""
                width={PHONE_W}
                height={PHONE_H}
                className={styles.phoneImg}
                sizes="260px"
              />
            </div>
            <div className={`${styles.phone} ${styles.phoneFront}`}>
              <Image
                src={kidHome}
                alt=""
                width={PHONE_W}
                height={PHONE_H}
                className={styles.phoneImg}
                sizes="260px"
                priority
              />
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------- trust strip --- */}
        <ul className={styles.trust}>
          <li>
            <Check size={18} aria-hidden="true" />
            $0 — free forever
          </li>
          <li>
            <CreditCard size={18} aria-hidden="true" />
            No credit card or real money
          </li>
          <li>
            <ShieldCheck size={18} aria-hidden="true" />
            Private — nothing sold, ever
          </li>
          <li>
            <Globe size={18} aria-hidden="true" />
            Any device — no app store
          </li>
        </ul>

        {/* ------------------------------------------------- how it works --- */}
        <section
          className={styles.block}
          id="how"
          aria-labelledby="how-heading"
        >
          <div className={styles.head}>
            <p className={styles.kicker}>How it works</p>
            <h2 className={styles.h2} id="how-heading">
              Set up once, then it runs itself
            </h2>
            <p className={styles.lead}>
              Everything lives inside the app — no spreadsheets, no accounts for
              the kids, no money to load.
            </p>
          </div>
          <ol className={styles.steps}>
            {STEPS.map((s, i) => (
              <li key={s.title} className={styles.step}>
                <span className={styles.stepNum}>{i + 1}</span>
                <h3 className={styles.stepTitle}>{s.title}</h3>
                <p className={styles.stepText}>{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ---------------------------------------------------- why pointsy --- */}
        <section
          className={styles.block}
          id="why"
          aria-labelledby="why-heading"
        >
          <div className={styles.head}>
            <p className={styles.kicker}>Why Pointsy</p>
            <h2 className={styles.h2} id="why-heading">
              The kids’ app that doesn’t want your bank details
            </h2>
            <p className={styles.lead}>
              Most “kids money” apps charge a monthly fee and hand your child a
              credit card. Pointsy uses points — so there’s nothing to fund,
              nothing to lose, and nothing to sell.
            </p>
          </div>
          <div className={styles.compareWrap}>
            <table className={styles.compare}>
              <thead>
                <tr>
                  <th scope="col">
                    <span className="sr-only">Feature</span>
                  </th>
                  <th scope="col" className={styles.colHi}>
                    Pointsy
                  </th>
                  <th scope="col">Credit-card apps</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map((row) => (
                  <tr key={row.label}>
                    <th scope="row">{row.label}</th>
                    <td className={styles.colHi}>{row.pointsy}</td>
                    <td className={styles.muted}>{row.others}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ------------------------------------------------------ features --- */}
        <section
          className={styles.block}
          id="features"
          aria-labelledby="features-heading"
        >
          <div className={styles.head}>
            <p className={styles.kicker}>Features</p>
            <h2 className={styles.h2} id="features-heading">
              Everything a family rewards system needs
            </h2>
            <p className={styles.lead}>
              Built for real households — fair, flexible, and genuinely fun for
              kids.
            </p>
          </div>
          <ul className={styles.features}>
            {FEATURES.map(({ Icon, title, text }) => (
              <li key={title} className={styles.feature}>
                <span className={styles.featureIcon}>
                  <Icon size={22} aria-hidden="true" />
                </span>
                <h3 className={styles.featureTitle}>{title}</h3>
                <p className={styles.featureText}>{text}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* ------------------------------------------------------ showcase --- */}
        <section className={styles.block} aria-labelledby="showcase-heading">
          <div className={styles.head}>
            <p className={styles.kicker}>A look inside</p>
            <h2 className={styles.h2} id="showcase-heading">
              Sleek on every screen
            </h2>
            <p className={styles.lead}>
              The dark “Emerald Noir” design makes points feel rewarding — for
              parents and kids alike.
            </p>
          </div>
          <ul className={styles.showcase}>
            {[
              {
                src: parentDash,
                title: "Parent dashboard",
                text: "Approvals & balances at a glance.",
                alt: "Pointsy parent dashboard with pending approvals and kid balances",
              },
              {
                src: kidHome,
                title: "Kid home",
                text: "Balance, must-dos, streaks & goals.",
                alt: "A kid’s Pointsy home screen with a big points balance and today’s chores",
              },
              {
                src: challengesShot,
                title: "Challenges",
                text: "Goals that pay a bonus when hit.",
                alt: "Pointsy challenges list with point goals and bonuses",
              },
              {
                src: kidRedeem,
                title: "Rewards",
                text: "Spend points solo — or team up.",
                alt: "Kid rewards screen with redeemable rewards and a team-up option",
              },
            ].map((shot) => (
              <li key={shot.title} className={styles.shot}>
                <div className={styles.shotImgWrap}>
                  <Image
                    src={shot.src}
                    alt={shot.alt}
                    fill
                    sizes="(max-width: 800px) 50vw, 260px"
                    className={styles.shotImg}
                  />
                </div>
                <h3 className={styles.shotTitle}>{shot.title}</h3>
                <p className={styles.shotText}>{shot.text}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* ------------------------------------------------- splits --- */}
        <section
          className={styles.block}
          id="challenges"
          aria-labelledby="challenges-heading"
        >
          <div className={styles.split}>
            <div className={styles.splitMedia}>
              <div className={styles.phone}>
                <Image
                  src={challengesShot}
                  alt="Pointsy challenge list showing point goals and a weekly reading streak"
                  width={PHONE_W}
                  height={PHONE_H}
                  className={styles.phoneImg}
                  sizes="240px"
                />
              </div>
            </div>
            <div className={styles.splitCopy}>
              <p className={styles.kicker}>Challenges</p>
              <h2 className={styles.h3} id="challenges-heading">
                Goals that keep kids motivated
              </h2>
              <p className={styles.lead}>
                Set a time-boxed challenge — earn 300 points this fortnight, log
                10 chores a week, or keep a daily streak — and Pointsy pays a
                bonus the moment it’s hit.
              </p>
              <ul className={styles.checks}>
                <li>
                  <Check size={20} aria-hidden="true" />
                  Per-kid races or one shared family goal
                </li>
                <li>
                  <Check size={20} aria-hidden="true" />
                  Optional weekly repeat that resets each Monday
                </li>
                <li>
                  <Check size={20} aria-hidden="true" />
                  Auto-pay the bonus, or hold it for your approval
                </li>
              </ul>
            </div>
          </div>

          <div className={`${styles.split} ${styles.splitReverse}`}>
            <div className={styles.splitMedia}>
              <div className={styles.phone}>
                <Image
                  src={kidRedeem}
                  alt="Kid rewards screen with a shared team reward and a team-up button"
                  width={PHONE_W}
                  height={PHONE_H}
                  className={styles.phoneImg}
                  sizes="240px"
                />
              </div>
            </div>
            <div className={styles.splitCopy}>
              <p className={styles.kicker}>Team-up rewards</p>
              <h2 className={styles.h3}>Bigger rewards, earned together</h2>
              <p className={styles.lead}>
                Some rewards are better shared. Mark a reward as a team reward
                and kids pool their points — pizza &amp; game night, a family
                outing — splitting the cost evenly.
              </p>
              <ul className={styles.checks}>
                <li>
                  <Check size={20} aria-hidden="true" />
                  Each kid sees their even share before opting in
                </li>
                <li>
                  <Check size={20} aria-hidden="true" />
                  Invites, live previews, and one parent approval
                </li>
                <li>
                  <Check size={20} aria-hidden="true" />
                  Shares are held until everyone’s in
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------- privacy --- */}
        <section
          className={`${styles.block} ${styles.privacyBlock}`}
          id="privacy"
          aria-labelledby="privacy-heading"
        >
          <p className={styles.kicker}>Privacy by design</p>
          <h2 className={styles.h2} id="privacy-heading">
            Built around children’s privacy
          </h2>
          <p className={styles.lead}>
            Kids aren’t users in the data sense — they’re just a name, an
            avatar, and a PIN inside your family. We collect the least we can,
            show no ads, and never sell anything. COPPA &amp; GDPR-K aligned.
          </p>
          <ul className={styles.privacyGrid}>
            {PRIVACY.map(({ Icon, title, text }) => (
              <li key={title}>
                <Icon size={20} aria-hidden="true" />
                <span>
                  <strong>{title}</strong> {text}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* ----------------------------------------------------------- faq --- */}
        <section
          className={styles.block}
          id="faq"
          aria-labelledby="faq-heading"
        >
          <div className={styles.head}>
            <p className={styles.kicker}>Questions</p>
            <h2 className={styles.h2} id="faq-heading">
              Good to know
            </h2>
          </div>
          <div className={styles.faqList}>
            {FAQ.map((f, i) => (
              <details
                key={f.q}
                className={styles.faqItem}
                open={i === 0}
                name="faq"
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

        {/* ------------------------------------------------------ final cta --- */}
        <section className={styles.ctaFinal}>
          <h2 className={styles.h2}>Make chores rewarding</h2>
          <p className={styles.lead}>
            Set up your family in a few minutes — it’s free, private, and
            there’s nothing to install.
          </p>
          <div className={styles.actions}>
            <a className={styles.primary} href="/sign-up">
              Create your family — it’s free
              <ArrowRight size={18} aria-hidden="true" />
            </a>
            <a className={styles.secondary} href="/sign-in">
              Parent sign in
            </a>
          </div>
          <p className={styles.ctaNote}>
            Already part of a family?{" "}
            <a href="/enter" className={styles.ctaLink}>
              Enter your family code
            </a>
            .
          </p>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
