# pointsy

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
