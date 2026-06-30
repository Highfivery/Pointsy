/**
 * Data for the marketing comparison pages (`/compare` and `/compare/[competitor]`).
 *
 * One source of truth so the pillar hub and each detail page stay consistent.
 * Competitor facts are as researched for 2026 and are framed fairly; each page
 * shows a "verify current pricing" note because these change.
 */

export type RowKey =
  | "price"
  | "freeTier"
  | "earn"
  | "card"
  | "bank"
  | "age"
  | "install"
  | "rewards"
  | "data"
  | "openSource";

/** Row labels + Pointsy's (constant) value for each. */
export const ROWS: { key: RowKey; label: string; pointsy: string }[] = [
  { key: "price", label: "Monthly price", pointsy: "Free" },
  { key: "freeTier", label: "Free tier", pointsy: "Yes — everything" },
  { key: "earn", label: "What kids earn", pointsy: "Points & rewards you set" },
  { key: "card", label: "Debit card", pointsy: "None" },
  { key: "bank", label: "Bank account / ID", pointsy: "Never needed" },
  { key: "age", label: "Minimum age", pointsy: "Any age" },
  {
    key: "install",
    label: "How you get it",
    pointsy: "Any browser · add to home screen",
  },
  { key: "rewards", label: "Reward types", pointsy: "Anything you choose" },
  { key: "data", label: "Ads / data sold", pointsy: "Never" },
  { key: "openSource", label: "Open-source", pointsy: "Yes (MIT)" },
];

/** A competitor "column" of values. */
export type Provider = {
  name: string;
  values: Record<RowKey, string>;
};

export const PROVIDERS: Record<string, Provider> = {
  greenlight: {
    name: "Greenlight",
    values: {
      price: "From $5.99",
      freeTier: "None",
      earn: "Real money on a card",
      card: "Yes (Mastercard)",
      bank: "Required (KYC)",
      age: "Kids & teens",
      install: "App Store / Google Play",
      rewards: "Mostly money",
      data: "Finance app",
      openSource: "No",
    },
  },
  acornsEarly: {
    name: "Acorns Early",
    values: {
      price: "From $8",
      freeTier: "30-day trial",
      earn: "Real money on a card",
      card: "Yes (Mastercard)",
      bank: "Required (KYC)",
      age: "6+",
      install: "App Store / Google Play",
      rewards: "Mostly money",
      data: "Investing upsell",
      openSource: "No",
    },
  },
  busykid: {
    name: "BusyKid",
    values: {
      price: "~$4 (billed yearly)",
      freeTier: "30-day trial",
      earn: "Real money + investing",
      card: "Yes (Visa prepaid)",
      bank: "Required (KYC)",
      age: "5+",
      install: "App Store / Google Play",
      rewards: "Money, stocks, charity",
      data: "Finance app",
      openSource: "No",
    },
  },
  famzoo: {
    name: "FamZoo",
    values: {
      price: "$5.99 ($4.99 prepaid)",
      freeTier: "Trial only",
      earn: "Real money (or IOU tracking)",
      card: "Yes (prepaid)",
      bank: "Required for cards",
      age: "All ages",
      install: "App Store / Google Play",
      rewards: "Mostly money",
      data: "No ads (paid)",
      openSource: "No",
    },
  },
};

export type Comparison = {
  slug: string;
  /** Competitor key(s) shown as columns alongside Pointsy. */
  providers: string[];
  /** Short label for nav/links, e.g. "Greenlight". */
  shortName: string;
  metaTitle: string;
  metaDescription: string;
  h1: { lead: string; highlight: string; tail: string };
  /** Answer-first lede (kept to ~2 sentences). */
  lede: string;
  /** TL;DR one-liner for the quick-answer card. */
  tldr: string;
  painPoints: { title: string; text: string }[];
  balance: string[];
  faqs: { q: string; a: string }[];
};

export const COMPARISONS: Record<string, Comparison> = {
  greenlight: {
    slug: "greenlight",
    providers: ["greenlight", "acornsEarly"],
    shortName: "Greenlight & Acorns Early",
    metaTitle: "Free Greenlight & Acorns Early Alternative (No Debit Card)",
    metaDescription:
      "Pointsy is a free, points-based alternative to Greenlight and Acorns Early — no debit card, no bank account, no monthly fee. Compare features for 2026.",
    h1: {
      lead: "A free",
      highlight: "Greenlight & Acorns Early",
      tail: "alternative — with no debit card",
    },
    lede: "Want to reward chores without a monthly fee or a kids' debit card? Pointsy is a free, points-based alternative to Greenlight and Acorns Early (formerly GoHenry). Kids earn points and redeem them for rewards you choose — no real money, no bank account, no app-store download.",
    tldr: "Greenlight (from $5.99/mo) and Acorns Early (from $8/mo) are paid debit-card apps that teach kids about real money. Pointsy is free and uses points instead — best if you just want a chore-and-reward system without a card, a bank account, or a subscription.",
    painPoints: [
      {
        title: "The monthly fee adds up",
        text: "$5.99–$12 a month is $70–$144 a year for what's often a chore tracker with a card attached.",
      },
      {
        title: "You may not want a card for a young kid",
        text: "Debit-card apps require a bank link and ID checks, and usually start at age 6. Points work at any age.",
      },
      {
        title: "Money isn't the only reward",
        text: "Many families would rather reward chores with screen time, outings or privileges. Pointsy lets you set any reward.",
      },
      {
        title: "No app store, no data trade",
        text: "Pointsy runs in any browser and adds to the home screen — no download — and never sells data or shows ads.",
      },
    ],
    balance: [
      "To be fair: if your main goal is teaching real-money skills — letting a teen spend in stores and online, build savings with interest, or start investing — a card app like Greenlight or Acorns Early is built for exactly that, and worth the fee.",
      "Pointsy is for the chores-to-rewards loop, not banking. Plenty of families even use both: a card app for spending, Pointsy for the everyday chore routine.",
    ],
    faqs: [
      {
        q: "Is Pointsy really free?",
        a: "Yes — every feature, for every family, with no subscription and no ads. It's open-source, which is also why it stays free.",
      },
      {
        q: "Does Pointsy give kids a debit card?",
        a: "No. There's no card and no real money — kids earn points and redeem them for rewards you set. There's no bank account or ID to provide.",
      },
      {
        q: "What happened to GoHenry?",
        a: "GoHenry's US service was folded into Acorns Early in late 2025. If you're comparing 'GoHenry alternatives,' Acorns Early is its successor — and Pointsy is the free, no-card option next to it.",
      },
      {
        q: "Can I switch from Greenlight to Pointsy?",
        a: "Yes — set up a free Pointsy family in a minute and recreate your chores and rewards as points. Many families keep a card app for spending and use Pointsy for the chore routine.",
      },
    ],
  },
  busykid: {
    slug: "busykid",
    providers: ["busykid"],
    shortName: "BusyKid",
    metaTitle: "Free BusyKid Alternative (No Card, No Subscription)",
    metaDescription:
      "Pointsy is a free, points-based alternative to BusyKid — no Visa card, no investing, no yearly fee. Compare chores, rewards and pricing for 2026.",
    h1: {
      lead: "A free",
      highlight: "BusyKid",
      tail: "alternative — points, not a prepaid card",
    },
    lede: "BusyKid pairs a chore chart with a Visa prepaid card and real stock investing, for about $48 a year. Pointsy keeps the chore-and-reward part, makes it free, and skips the card and the markets entirely — kids earn points and redeem them for rewards you set.",
    tldr: "BusyKid (~$4/mo billed yearly) is a real-money app with a Visa card and kid investing. Pointsy is free and points-only — best if you want the chores-and-rewards routine without a card, investing, or a subscription.",
    painPoints: [
      {
        title: "It's a yearly subscription",
        text: "BusyKid bills around $48/year, plus possible card fees. Pointsy is free, with nothing to buy.",
      },
      {
        title: "Investing isn't for every family",
        text: "BusyKid steers kids toward real stock investing. If you just want chores and rewards, that's complexity you don't need.",
      },
      {
        title: "A card means a bank link and an age floor",
        text: "The Visa prepaid card needs ID and starts at age 5. Pointsy's points work at any age with nothing to fund.",
      },
      {
        title: "No app store, no data trade",
        text: "Pointsy runs in any browser, adds to the home screen, and never sells data or shows ads.",
      },
    ],
    balance: [
      "To be fair: BusyKid's earn-save-share-invest model is genuinely good if you want your child handling real money and learning to invest early — that's the whole point of it.",
      "Pointsy deliberately leaves real money out. It's for turning chores into points and rewards, simply and for free — not for banking or the stock market.",
    ],
    faqs: [
      {
        q: "Is Pointsy free, unlike BusyKid?",
        a: "Yes. BusyKid is a paid yearly subscription; Pointsy is completely free, with every feature included and no ads.",
      },
      {
        q: "Does Pointsy do investing like BusyKid?",
        a: "No — and that's by design. Pointsy is points-and-rewards only, with no real money, no card, and no markets.",
      },
      {
        q: "Can Pointsy still handle allowance-style chores?",
        a: "Yes. Set chores, award points, and let kids redeem rewards you choose — including ones you value in dollars if you want. There's just no card moving real money.",
      },
    ],
  },
  famzoo: {
    slug: "famzoo",
    providers: ["famzoo"],
    shortName: "FamZoo",
    metaTitle: "Free FamZoo Alternative (No Monthly Fee)",
    metaDescription:
      "Pointsy is a free alternative to FamZoo — including FamZoo's no-card 'IOU' style tracking, but with no $5.99/mo fee. Compare for 2026.",
    h1: {
      lead: "A free",
      highlight: "FamZoo",
      tail: "alternative — including the no-card part",
    },
    lede: "FamZoo offers prepaid cards and a no-card 'IOU' mode that tracks points and allowances — but charges $5.99/month either way. Pointsy gives you that same virtual chore-and-reward experience for free, with PIN-gated kid profiles and no app-store install.",
    tldr: "FamZoo is a paid family-finance app ($5.99/mo) — even its no-card 'IOU' mode costs the same. Pointsy does the virtual points-and-rewards part for free, with nothing to fund and no subscription.",
    painPoints: [
      {
        title: "You pay even without a card",
        text: "FamZoo charges $5.99/mo even for its no-card IOU mode. Pointsy's virtual points are free, full stop.",
      },
      {
        title: "The IOU mode is framed as 'not ready yet'",
        text: "FamZoo treats no-card tracking as a stepping stone to a card. Pointsy makes points the whole point — on purpose.",
      },
      {
        title: "Cards mean US-only and ID checks",
        text: "FamZoo's cards are US-only with KYC. Pointsy works in any browser, anywhere, at any age.",
      },
      {
        title: "No app store, no data trade",
        text: "Pointsy adds to the home screen with no download, and never sells data or shows ads.",
      },
    ],
    balance: [
      "To be fair: FamZoo has been trusted since 2013 and its card-plus-IOU system is flexible if you eventually want real money, parent-paid interest, and detailed family-finance tracking.",
      "Pointsy is simpler and free. If you mainly want virtual points, chores and rewards — without a subscription or a card upsell — it covers that without the monthly fee.",
    ],
    faqs: [
      {
        q: "Pointsy vs FamZoo's IOU accounts — what's the difference?",
        a: "Both track virtual balances with no card. The difference is price: FamZoo charges $5.99/mo for IOU mode; Pointsy is free. Pointsy also adds PIN-gated kid profiles and works as an install-free web app.",
      },
      {
        q: "Is Pointsy really free?",
        a: "Yes — every feature, no subscription, no ads. It's open-source, so it stays free.",
      },
      {
        q: "Does Pointsy use real money?",
        a: "No. Points only — you decide what they're worth and which rewards they buy. There's no card and no bank link.",
      },
    ],
  },
};

export const COMPARISON_SLUGS = Object.keys(COMPARISONS);
