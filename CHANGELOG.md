# pointsy

## 0.37.1

### Patch Changes

- ffb6d6e: Fix the PWA showing a previous session's screen on first open after closing the
  app — e.g. tapping "Parent? Sign in" landing on the last kid's dashboard. The
  service worker was caching authenticated HTML/RSC and serving it stale on cold
  start. It now caches only static assets (JS, CSS, images, fonts) and always
  fetches pages from the network, so the server's session logic decides what
  renders. Old page caches are purged when the new worker activates.

## 0.37.0

### Minor Changes

- 5669db0: Show shared/core context on chores wherever they appear, and tidy up the kid's
  chore list:

  - **My chores** now shows only the kid's own chores — a chore assigned to
    another kid, or a rotating chore on someone else's turn, is hidden rather than
    shown as a locked card.
  - **Shared** is now a distinct chip (alongside Core) on the parent chore
    catalog, the award screen, and the chore-approvals queue, so it's obvious at a
    glance which chores are first-come-first-served.

## 0.36.0

### Minor Changes

- 9ab4020: Add a per-kid vs shared scope to chore claim limits. A chore's limit can now
  either apply to each kid (the existing behaviour, now clearly labelled "… each")
  or be a shared family-wide total ("… · shared") that's first come, first served
  — once it's been claimed the allowed number of times by anyone, it's gone for
  everyone that day/week. Kids see how many shared slots are left, and a chore
  another kid already claimed shows "<name> got it first" instead of the green
  "Done". Shared and "Core" are mutually exclusive. Claims are serialised so two
  kids can't both slip past a cap of one.

## 0.35.2

### Patch Changes

- 86c8167: Add a subtle "Coming up later" separator on the kid's Today must-dos, between
  the chores they can do now and the time-locked ones waiting to unlock — so the
  grouping reads clearly rather than looking like an arbitrary order.

## 0.35.1

### Patch Changes

- 7d2a5d4: Sort time-locked chores (the ones showing an "Unlocks in" countdown) to the
  bottom of the kid's Today must-dos and Chores screens, so the chores a kid can
  do right now group together at the top (#123).

## 0.35.0

### Minor Changes

- f883cb6: Show a chore's logging window on the parent chore-list cards. When a chore has a
  day or time restriction, its card now displays a subtle clock chip summarising
  it (e.g. "Weekdays, 6–8 PM", "Tue, Fri", "Until 8 PM"). Chores without a window
  are unchanged.

## 0.34.1

### Patch Changes

- bd909fb: Polish the chore logging-window editor: fix the missing spacing below the
  "Which days?" label so it matches the other fields, and reword the time-of-day
  options to the clearer "Only from a set time" / "Only until a set time".

## 0.34.0

### Minor Changes

- 15a2346: Add optional logging windows to chores. Parents can now restrict when a kid may
  log a chore — by day of the week (with Every day / Weekdays / Weekends presets)
  and by time of day (only after, only before, or only between two times),
  evaluated in the family timezone. Outside its window a chore is locked on the
  kid's screens with a friendly "Opens …" label and a live countdown to when it
  reopens; a grown-up can still award it manually at any time. Day-restricted core
  chores only count toward the streak on the days they're actually loggable.

## 0.33.4

### Patch Changes

- 8139c73: Render the PIN dots as SVG circles. Styled HTML elements for the dots could fail
  to paint on some real iOS devices even when they rendered fine everywhere else;
  SVG `<circle>`s render identically across devices, so the four dots now always
  show (empty = muted sage, filled = emerald, wrong attempt = rose + shake).

## 0.33.3

### Patch Changes

- 7cc6b38: Render the PIN dots as solid filled circles that can't collapse on iOS. The
  previous empty-`<span>`-with-border construct rendered in desktop WebKit but
  could vanish on a real iPhone; the dots are now solid fills with `flex: 0 0 20px`
  so all four positions always show.

## 0.33.2

### Patch Changes

- d539a58: Make the installed PWA update itself more reliably. The app now checks for a new
  version on load, on focus, and on an interval, actively promotes a waiting service
  worker (so a stuck one can't keep serving an old build), and reloads once the new
  worker takes over — so releases reach the home-screen app without a manual
  reinstall. (iOS still only refreshes the home-screen _icon_ on reinstall.)

## 0.33.1

### Patch Changes

- 870d2ff: Make the PIN-pad dots unmistakable. The empty slots are now filled circles with a
  bright (7:1) ring instead of a faint hairline, so all four positions always read
  clearly — including the moment right after a wrong PIN clears the pad. Verified on
  a production build.

## 0.33.0

### Minor Changes

- c1e922f: **Rewards just for one kid, with a motivational dashboard.** Parents can now mark
  a reward as "Just for [kid]" when creating or editing it (a new "Who's it for?"
  picker on the reward form). A kid-specific reward is private to that kid — only
  they see it in Redeem — and it appears on their dashboard in a bright new "🎯
  Just for you" section: a progress ring and bar toward the reward, a cheer that
  grows as they get closer ("Great start" → "Halfway" → "So close"), how many
  points are left, and a celebratory "Claim it!" once they've saved enough. Leaving
  it as "Everyone" keeps the existing family-wide behaviour.

### Patch Changes

- 1d0aa5b: Kids can now log a "Today's must-do" straight from their dashboard — each must-do
  is tappable, and tapping it opens the same confirmation sheet used elsewhere
  ("Did you finish X?") so a stray tap never logs a chore. Confirming sends it for
  a grown-up to approve, just like the Chores page.

## 0.32.0

### Minor Changes

- 486410b: Add ~100 more icons to choose from. Every icon picker in the app (kid & parent
  avatars, chores, rewards, categories) now offers a much larger library —
  weather, food, school & science, household, sports, vehicles, tech, and fun
  symbols — roughly 300 icons in total. Existing keys are unchanged, so all current
  selections keep rendering.

## 0.31.2

### Patch Changes

- 66b65d2: Apply database migrations automatically on production deploys
  (`scripts/vercel-migrate.mjs` runs before the build when `VERCEL_ENV=production`).
  This closes the gap that let a schema-dependent query ship ahead of its migration
  and break kid login — the deploy now never serves code against an un-migrated
  database.

## 0.31.1

### Patch Changes

- 0beddb9: Fix invisible PIN dots. The empty PIN slots were filled with the near-black
  `--color-border`, so on the dark background they vanished — when the pad was
  empty (including right after a wrong PIN cleared it) there was no visible cue
  where digits go. Empty slots are now clearly visible hollow rings that fill solid
  emerald as you type, flash red on a wrong attempt, then return to visible rings.

## 0.31.0

### Minor Changes

- 482d476: **Deduct points straight from the dashboard, and a faster award/deduct flow.**
  Each kid card on the parent dashboard now has both an **Award** and a **Deduct**
  action (previously only Award). The kid's points screen leads with the
  **Award or deduct points** card — now pinned to the top, always open — so logging
  a manual change is the first thing you see. Tapping **Deduct** on the dashboard
  opens that screen with Deduct preselected.

## 0.30.0

### Minor Changes

- dd0b312: **Custom chore categories.** Chore categories are no longer hard-coded — each
  family now manages its own. A new **Manage → Categories** screen (reached from
  the Chores screen) lets parents add, rename, re-icon, reorder, and delete
  categories. Deleting a category that still holds chores prompts you to move them
  to another category first, so nothing is ever orphaned, and the last category
  can't be removed.

  Every existing family is migrated automatically: the previous nine categories
  are seeded per family and each chore is re-pointed to its matching one, so all
  current groupings are preserved. New families start with the same sensible set.
  The chore editor, award screen, kid "My chores" screen, and chore list all group
  by the family's own categories.

- fb27aeb: Add a bottom nav to the parent dashboard and refresh the app icons.

  - The dashboard now carries the same fixed bottom navigation as the rest of the
    app, with quick access to **Kids · Chores · Rewards · Challenges · Parents**.
    This replaces the long vertical list of management links, making the dashboard
    shorter and more consistent with the manage screens.
  - App icons, the maskable icon, the Apple touch icon and `favicon.ico` are
    regenerated to the Emerald Noir palette (emerald→cyan gradient mark), and the
    PWA manifest's `theme_color`/`background_color` now match the dark theme.

- 08e96b5: Rebrand to a dark, modern "Emerald Noir" design system and standardise the UI.

  - **New look:** a dark-only theme with an emerald→cyan gradient accent, glassy
    elevated surfaces, the Sora display + Inter body typefaces, and tasteful motion
    (page fades, count-up balances, staggered list entrances, press feedback) — all
    respecting `prefers-reduced-motion`. Accessibility target moves from WCAG AAA to
    AA (still fully AA-conformant).
  - **Shared components:** a single set of primitives (`Card`, `IconButton`, `Chip`,
    `ScreenHeader`, `BottomNav`) now backs every card and screen for consistency.
  - **Manage screens:** each of Rewards, Chores, Challenges and Kids gains a
    contextual bottom nav (`Dashboard · Section · Add`), a dedicated "Add" page, and
    fully-contained cards with inline icon actions (edit / hide / delete, etc.).
    Chores can be filtered by category.
  - **Challenges:** the end date is now optional when a challenge repeats every week,
    so weekly challenges can run indefinitely.

### Patch Changes

- 049f790: Polish the award/deduct points card: the "Points awarded/deducted" confirmation
  now hides itself if you switch direction without submitting, so it always
  matches the toggle. Internally, the award-vs-deduct routing is centralised in a
  `changePoints` service function (single source of truth for the sign) with a
  direct integration test.
- 6437255: Extend the fixed bottom nav to every authenticated screen for consistent
  navigation. The parents page, the award screen, and the chore/challenge editor
  pages now carry a contextual bottom nav (replacing their one-off "back" links),
  matching the dashboard, manage, and kid screens.
- 996fa25: Two parent/kid-facing fixes:

  - **PIN pad now reacts to a wrong entry.** A rejected PIN flashes the dots red
    and shakes them, then clears the pad so the next attempt visibly starts fresh.
    Previously a repeated wrong PIN (identical error text) could leave the pad full
    and unresponsive with no feedback. The flash honours `prefers-reduced-motion`.
  - **Award screen can deduct points, not just award them.** The custom-points card
    gains an Award / Deduct segmented toggle, so a parent enters a plain positive
    amount and the button restates the action ("Award points" / "Deduct points") —
    no more typing a minus sign into an "adjust" field. Deductions are recorded as
    negative `adjust` ledger rows, keeping the ledger append-only.

## 0.29.0

### Minor Changes

- 7afa25b: Challenges can now require a parent to confirm the bonus. In the challenge
  editor, "Hold the bonus until I approve it" makes a completed challenge wait
  instead of auto-paying: the kid sees "Done — waiting for a grown-up", and the
  parent gets a **Challenge approvals** queue on the dashboard to approve (pays the
  bonus) or deny. Auto-award stays the default, so existing challenges are
  unchanged. (Migration 0015.)

## 0.28.0

### Minor Changes

- 8a0fd27: Team rewards are more flexible. A team reward can now **also be redeemed solo**
  (an "Also redeemable solo" option in the reward editor) — so a reward can be
  individual, team-only, or both. On the kid's Rewards screen a "both" reward shows
  **Team up** and **Solo** actions side by side; team-only rewards can't be grabbed
  alone. Parents also get a **Team rewards to hand out** queue on the dashboard to
  mark approved team rewards as delivered, matching solo redemptions.

## 0.27.0

### Minor Changes

- ef0cd8b: Team-up rewards are now fully interactive. On the Rewards screen, a kid can tap
  **Team up** on a team reward, pick teammates, and see their own even share update
  live before sending invites. Each teammate gets an invite with their share and an
  **I'm in! / No thanks** — their share is held against their balance while it's
  pending, and a decline calls the whole thing off and releases everyone. Once all
  teammates are in, the team-up appears under **Team-up approvals** on the parent
  dashboard (who's in and each share); approving deducts every kid's share at once.

## 0.26.0

### Minor Changes

- 3fde0c6: Rewards can be marked as **team rewards**. In the reward editor, a "Team reward"
  toggle (with a minimum number of kids) flags a reward that several kids redeem
  together by splitting the cost evenly. This lays the groundwork — the kid
  propose / opt-in and parent approval flow follows next. Under the hood: an
  even-split helper, reserve-aware availability so each kid's share is held while a
  team-up is pending, and an idempotent per-member payout on approval.

## 0.25.0

### Minor Changes

- f5b6223: Challenges can now repeat **weekly**. When creating a challenge, parents pick
  "One-off" or "Every week" — a weekly challenge resets each Monday within its date
  range and pays the bonus again every week the goal is met. Progress is measured
  per-week, the bonus is still paid exactly once per kid per week, and both the
  parent list and the kid's Home screen show a "Weekly" tag.

## 0.24.0

### Minor Changes

- 44432c7: Kids can now see their challenges. The Home screen shows a "Challenges" section
  with a live progress bar for every active challenge the kid is part of —
  "12 / 20 points", "Team" on shared family goals — that turns green and reads
  "Done! Bonus earned 🎉" once completed. The points bonus lands automatically and
  shows up in Recent activity, with the usual points celebration on the balance.

## 0.23.0

### Minor Changes

- ac2440e: Challenges — time-boxed goals that pay a bonus. Parents can set a challenge
  (under Manage → Challenges) that runs over a date range and measures one of three
  things: points earned, chores logged, or days with all core chores done. A
  challenge is either **per-kid** (everyone races on their own) or **whole-family**
  (one shared tally). When the goal is met the bonus is paid automatically and
  exactly once per kid — family challenges pay every participating kid the full
  bonus. Progress is derived from the ledger and chore history (never stored), and
  payouts are evaluated whenever a kid earns points or a chore is approved.

## 0.22.0

### Minor Changes

- b795657: A proper kid experience for chores. Kids now have a bottom **tab bar** (Home ·
  Chores · Rewards) instead of scattered links. The **Home** screen gained a
  "Today's must-dos" hub: a daily progress ring over their core chores, an
  all-done streak, and a quick list of what's still left with a one-tap jump to
  Chores — progress fills the moment a chore is logged. The **Chores** screen now
  leads with today's must-dos and shows clear, friendly states for every chore:
  a green "Done today" card when finished, and a calm locked card with the reason
  ("Robin's turn", "Not your chore") when it isn't the kid's to do — no more
  greyed-out, ambiguous buttons.

## 0.21.0

### Minor Changes

- 74676b0: Safer reward redemptions for kids. Tapping a reward now opens a confirmation
  bottom sheet ("Request X? This uses N points…") so a stray tap never spends
  points — on both the kid dashboard shelf and the Rewards screen. Kids whose
  balance is negative can no longer redeem anything: the Rewards screen shows a
  clear "earn back to zero" message with every reward locked, and the request is
  blocked server-side as a safeguard.

## 0.20.0

### Minor Changes

- beb06eb: Chore checklists (subtasks). A chore can now have an ordered checklist of steps
  (e.g. "Full bathroom clean" → wipe counters, clean mirror, sweep…), added in the
  chore editor. On the kid's "Log a chore" screen, a checklist chore expands and
  can only be logged once **every step is ticked**.

## 0.19.0

### Minor Changes

- 1402c9a: Dedicated chore editor + assignment & rotation.

  Chores are now created and edited on a full-screen **editor page** (Basics ·
  Who & when · Limits · Description) instead of a cramped inline card; the manage
  list is a clean overview that taps through to it.

  New in the editor:

  - **Who's it for?** — Everyone, specific kids, or **Take turns** (a rotating
    queue that passes to the next kid only once the current one completes it).
  - **Core chore** flag for chores expected every day (groundwork for challenges).

  Assignment is threaded everywhere: the overview shows whose turn it is, and a
  kid's "Log a chore" screen shows every chore but **locks** the ones that aren't
  theirs / not their turn with a reason like "Robin's turn".

## 0.18.2

### Patch Changes

- bc8cffc: Fix two reported bugs:

  - **Chore frequency wouldn't reset to Unlimited (#56).** The add form and every
    edit card reused the same element ids, so an edit form's "How often" label
    targeted the wrong control and the "Times per day" field appeared stuck. Ids
    are now unique per instance.
  - **"Strange blue bar" on kid sign-in (#65).** The points-earned celebration was
    an indigo toast that read as a random bar. It's now a clear, centered
    "🎉 +N points!" card with confetti and a "Yay!" button — non-blocking,
    dismissible, and reduced-motion aware.

## 0.18.1

### Patch Changes

- b55fbe4: Polish the manage chore/reward cards. Drop the loud, redundant category pill (the
  card already sits under its category heading), show points and the claim-frequency
  as subtle chips on one tidy line, and tidy the spacing and control alignment so
  nothing feels cramped.

## 0.18.0

### Minor Changes

- 8d9e744: Big chore + reward experience upgrade.

  **Categories everywhere** — chores now have an area (Bedroom, Bathroom, Kitchen,
  Around the home, Outdoor, Pets, School, Self-care, Other). Every view groups by
  category with a how-often badge (Anytime / N× per day / N× per week): the award
  screen, the manage list, and the kid's "log a chore" screen.

  **Faster awarding** — the parent Award screen gains a search box, a "Most used"
  shortcut row, pinnable favourites (★), and "Also give to" so one tap can award
  several kids at once.

  **A kid dashboard that hypes them up** — a "🎉 You can get these now!" shelf of
  affordable rewards, an "Almost there!" progress bar to the closest reward, a
  savings-goal ring you set yourself, an earning streak, and a little confetti
  celebration when points go up (respecting reduced-motion).

## 0.17.0

### Minor Changes

- 669eeff: One shared icon library everywhere. Every picker (kid & parent avatars, chores,
  rewards) now draws from the same comprehensive ~200-icon set instead of three
  smaller per-context lists, so the same icons are available on every screen. The
  library is grouped by theme and shown in a compact scrollable area. Existing
  saved icons are unchanged.

## 0.16.0

### Minor Changes

- f5c5270: Replace the sign-in PIN field with a sleek on-screen number pad — large
  tap-friendly keys, fill-dots, a delete key, and auto-submit on the last digit
  (clears for a quick retry after a wrong PIN). Faster and easier for kids to sign
  in on a phone.

## 0.15.1

### Patch Changes

- b75c59e: Make the installed PWA reliable. Add the iOS `apple-touch-icon` and
  `apple-mobile-web-app` metadata so the Home Screen shows the Pointsy icon (iOS
  ignores the web manifest for this). Add a service-worker auto-updater that checks
  for a new version on load and when the app regains focus and reloads once it
  takes control — so each release reaches the installed app without reinstalling
  (this is why new icons weren't appearing).

## 0.15.0

### Minor Changes

- eb3dbf5: Kids can now log chores they've completed for parent approval. A new "Log a
  chore" screen lets a kid submit a completed chore; it appears in a "Chore
  approvals" queue on the parent dashboard, and approving adds the points (an
  append-only ledger earn row) while rejecting adds none. The kid's home shows
  Total points and a separate "Pending" total with a "Waiting for approval" list
  they can withdraw from. Per-chore daily/weekly limits (from the previous release)
  are enforced at the family's local midnight — maxed chores show "Done for today".
  Chores also gain an optional short description, shown on the log-a-chore screen.
  Push notifications fire to parents on submit and to the kid on approve/reject.

## 0.14.0

### Minor Changes

- 026332c: Greatly expand the icon pickers. Avatars go from 21 to 43 (turtle, squirrel,
  panda, rainbow, robot, magic wand, plane, mountain, and more), chore icons from
  16 to 34 (cooking, groceries, recycling, fix-it, washing, study, music, science…),
  and reward icons from 16 to 35 (cake, donut, headphones, board game, savings,
  outings, fruit…). All keys stay in sync with the registry via the existing test.

### Patch Changes

- 026332c: Fix a hydration mismatch in the dashboard's family-timezone control: it used
  `Intl.supportedValuesOf("timeZone")` during render, and the server's and
  browser's IANA lists can differ, which mismatched the rendered options. It now
  uses a deterministic curated list of common zones (the exact zone is still
  auto-detected). Resolves intermittent flakiness on WebKit.

## 0.13.0

### Minor Changes

- dd6a7a7: Foundation for kid-submitted chores: per-chore claim limits and a family
  timezone. Parents can now set how often a kid may claim each chore — Unlimited,
  or a set number per day or per week — right on the chore form. Families also get
  a timezone (auto-detected from the browser at sign-up, editable on the
  dashboard, defaulting to UTC) so those daily/weekly limits reset at the family's
  local midnight. Enforcement arrives with the kid submission flow in the next
  change.

## 0.12.2

### Patch Changes

- 1bbfbce: Clearer homepage and sign-in copy. The home page now separates the two ways an
  existing family member gets in — an "Already part of a family?" section with a
  distinct "Kids & family → enter your family code" entry and an "Invited as a
  co-parent? → enter your invite code" entry (the latter routes to /join, so
  co-parents finally have an obvious path). The profile picker's heading now
  matches each step: "Find your family" + family-code field when finding the
  family (no more "Tap your name" with no names on screen), the picker, then the
  PIN step.

## 0.12.1

### Patch Changes

- 644afa6: Parents now default to a neutral person avatar instead of an unrendered emoji
  (which showed as a generic fallback icon in the profile picker). Adds a "Person"
  icon to the avatar set, defaults both the family creator and invited co-parents
  to it, fixes the stale `people.avatar` column default, and backfills existing
  parents.

## 0.12.0

### Minor Changes

- 3967d3b: Add co-parents: a parent can invite another parent to share the family
  dashboard. The inviting parent generates a one-time, 72-hour invite **code**
  (shown once, shared by them — the app never emails it); the co-parent redeems it
  at a new `/join` page by creating their own email + password login and agreeing
  to consent. A new "Parents" screen lists grown-ups (with Owner/You badges),
  shows pending invites with revoke, and lets the **owner** (the family creator,
  who can't be removed) remove co-parents. Role isolation and the keep-at-least-one
  guarantee are enforced.

## 0.11.1

### Patch Changes

- e927c3e: Redesign the notifications opt-in as a proper labelled card (icon, "Notifications"
  heading, contextual description, and an Enable button / On + Turn off state) that
  matches the other dashboard cards, instead of a lone solid-primary pill. Parents
  and kids get audience-specific copy. Also adds the missing `--space-5` design
  token, which fixes the button's collapsed padding and the redeem grid gap.

## 0.11.0

### Minor Changes

- c70f966: Fix the home page for signed-in users and harden route authorization.

  - The homepage now resolves the family from the **session first**, device cookie
    second — so a logged-in person always lands on the family profile picker, never
    the marketing page, even on a device whose cookie predates the picker. The proxy
    also heals the device→family cookie for older sessions.
  - **Security:** enforce role isolation on protected routes. A kid session can no
    longer open a parent route (`/dashboard`, `/manage`, `/award`) by URL (and a
    parent can't open kid routes) — enforced in the proxy and re-checked in each
    page. Previously `/dashboard` accepted any session regardless of role.

## 0.10.0

### Minor Changes

- ef40d21: Home opens to the family profile picker on any device that's already used
  Pointsy — tap your face and enter your PIN — instead of the marketing page or a
  "re-enter your family code" step. A signed-in user or a known device never sees
  marketing or a sign-in form as the home. Parents and kids share one PIN-gated
  picker (parents without a PIN can still use email + password); brand-new devices
  still see the marketing page. Web Push no longer needs a configured contact
  address (it auto-derives), and the personal email default was removed.

## 0.9.0

### Minor Changes

- d29523c: Add opt-in Web Push notifications. Parents and kids can enable notifications
  from the dashboard / kid home; the app then alerts parents when a child requests
  a reward, and alerts a child when they earn points or a reward is approved.
  Backed by a new `push_subscriptions` table, a VAPID-gated sender (a graceful
  no-op until the keys are configured), and a service-worker push handler.

## 0.8.0

### Minor Changes

- 7cc2ff7: Add an optional parent quick-PIN and make kid sign-in discoverable. Parents can
  set a 4-digit PIN from the dashboard to sign in via the profile picker on a
  shared device (email + password still works). The dashboard now points to the
  kid PIN sign-in page, the landing page has a clear "Kids' PIN sign-in" button,
  and a remembered device shows a one-tap shortcut straight to the picker.

## 0.7.1

### Patch Changes

- a03ab60: Polish: migrate to the Next 16 `proxy` convention (replacing the deprecated
  `middleware` file), add loading skeletons for the data-heavy screens, verify and
  fix dark-mode contrast to meet AAA (with a dedicated dark-mode accessibility
  check), and add a reduced-motion-safe pop-in for the points balance.

## 0.7.0

### Minor Changes

- 6c92aec: Add redemptions — the final piece of the core loop. Kids browse rewards they can
  afford and request them (points are reserved while pending; the "available"
  balance reflects reservations), and can cancel a pending request. Parents
  approve (points deduct via a redeem ledger row) or deny (reserve released) from
  a dashboard queue, and approved rewards move to an "awaiting delivery" list to
  mark fulfilled.

## 0.6.0

### Minor Changes

- 862f53e: Add the points engine. Parents can award points to a child from the chore
  catalog (one tap), award custom points with a reason, and make manual
  adjustments (including negative). The dashboard shows each kid's live balance
  with an award shortcut, the new award screen lists chores and recent activity,
  and the kid's home shows their real balance and activity feed. Balances are
  derived from an append-only ledger.

## 0.5.1

### Patch Changes

- eac44fc: Redesign the dashboard management navigation. The cramped "Kids / Chores /
  Rewards" pills are now clean, full-width list rows with an icon chip, a label, a
  short hint, and a chevron — more legible, easier to tap, and consistent with the
  rest of the UI.

## 0.5.0

### Minor Changes

- dfe2b85: Replace emoji text inputs with a sleek, accessible Lucide icon picker for kid
  avatars and chore/reward icons. The picker is a keyboard-navigable radio grid,
  and icons render consistently across the dashboard, manage screens, profile
  picker, and kid home. (Items created before this change show a neutral fallback
  icon until re-saved.)

## 0.4.0

### Minor Changes

- 71076ee: Add the chore and reward catalogs. Parents can create, edit, reorder (move
  up/down), hide/show, and delete chores (name, emoji, points) and rewards (name,
  emoji, cost, optional description) from new `/manage/chores` and `/manage/rewards`
  screens, linked from the dashboard.

## 0.3.1

### Patch Changes

- d08f056: Fix database connections failing on Node versions before 22 (e.g. local `npm run
dev` on Node 20). The neon-serverless driver requires a WebSocket; we now fall
  back to the `ws` package when no global `WebSocket` is available, so the app
  works on any Node version while still using native WebSocket on Node 22+/Vercel.

## 0.3.0

### Minor Changes

- e06e686: Add kids and PIN-based sign-in. Parents can manage child profiles (name, avatar,
  color, 4-digit PIN) with edit, reset-PIN, and deactivate/reactivate. Kids sign in
  through an avatar profile picker plus their PIN on a remembered device (with a
  family-code fallback), landing on a minimal kid home. PIN attempts are
  rate-limited with a lockout after repeated failures.

### Patch Changes

- e5efb72: Add a `/api/health` endpoint that verifies database connectivity (for uptime
  monitoring), plus Vercel deploy config (`vercel.json` build command + Node 22
  `engines`) and dotenv-powered local migrations so `npm run db:migrate` reads
  `.env.local` (preferring the direct/unpooled URL).

## 0.2.0

### Minor Changes

- 08b0f23: Add parent authentication and multi-tenant family onboarding: email + password
  sign-up with guardian consent, sign-in, sign-out, signed session cookies, edge
  middleware route protection, and a minimal protected dashboard showing the
  family name and join code. Introduces a driver-agnostic database client
  (neon-serverless in production, node-postgres in CI) and a tenant-isolated
  service layer covered by PGlite integration tests and a DB-backed Playwright
  flow.
