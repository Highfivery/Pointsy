# pointsy

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
