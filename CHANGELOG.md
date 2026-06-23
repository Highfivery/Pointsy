# pointsy

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
