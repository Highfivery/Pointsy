# Pointsy — Product & Technical Specification

> A simple, sleek, mobile-first PWA where parents award points to kids for chores/good
> behavior, and kids redeem those points for rewards. Multi-family, self-onboarding,
> open-source. Built to be developed almost entirely by Claude with heavy automation.

**Status:** v1 spec · **Last updated:** 2026-06-22 · **Owner:** Ben Marshall

---

## 1. Product overview

### 1.1 Vision

Pointsy makes a family rewards system effortless. A parent awards points from a tap-friendly
catalog of chores/behaviors; kids watch their balance grow and spend it on rewards a parent
has defined. Everything — sign up, family setup, kids, chores, rewards — is configured **inside
the app**. No spreadsheets, no infra knowledge required.

### 1.2 Goals

- **Fast & sleek**: every common action is 1–3 taps; optimistic UI; feels instant.
- **Kid-friendly**: big numbers, avatars, color, emoji, zero jargon.
- **Trustworthy**: balances are computed from an immutable ledger and can never silently drift.
- **Multi-family & scalable**: one deployment serves many families with strict data isolation.
- **Self-service onboarding**: a parent can go from zero to awarding points in under 3 minutes.
- **Open-source friendly**: anyone can fork, point at a free Neon DB, and deploy to Vercel.

### 1.3 Non-goals (v1)

- No money/real-currency handling. Points are abstract.
- **No billing/subscriptions.** Pointsy is a **free, multi-tenant** product: any family can
  self-sign-up and use it at no cost. Open-source. (Monetization is explicitly out of scope; if
  added later it would be a deliberate v2 effort, not a seam we pre-build now.)
- No social/cross-family features, leaderboards across families, or marketplaces.
- No native app stores — PWA only (installable to home screen).
- No complex role hierarchies beyond Parent / Kid.

### 1.5 Product model & data minimization (kids' privacy)

Pointsy is a free, self-service, multi-tenant web app. Because it serves **children's data**, it
is designed around **data minimization** so the compliance surface (COPPA / GDPR-K) stays small:

- **Only parents have accounts.** A parent is the only person who provides an email/password and
  is the legal account owner. Kids are **not** users in the PII sense — a kid is just a
  `name + avatar + color + PIN` inside the parent's family. No kid email, no kid contact info, no
  behavioral tracking, no third-party analytics on kids.
- **Parental consent at signup.** Account creation requires the parent to affirm they are the
  parent/guardian and consent to managing their children's profiles (logged with timestamp).
- **Parent controls all kid data** — create, edit, deactivate, delete, and export.
- **Right to erasure & export.** A parent can export their family's data (JSON/CSV) and delete the
  family entirely (hard-deletes all `family_id`-scoped rows).
- **No selling/sharing data; no ads.** Minimal lightweight, privacy-respecting product analytics
  on parent actions only (or none) — never on children.
- Lightweight **Terms of Service** and **Privacy Policy** pages ship with v1 stating the above.

### 1.4 Personas

- **Parent (admin)**: full control. Awards/adjusts points, manages chores & rewards, approves
  redemptions, manages kids and co-parents, family settings.
- **Kid**: views balance & history, browses rewards, requests redemptions. Cannot award points
  or edit catalogs.

---

## 2. Core decisions (locked)

| Decision      | Choice                                          | Rationale                                                          |
| ------------- | ----------------------------------------------- | ------------------------------------------------------------------ |
| Frontend      | Next.js (App Router) + TypeScript               | SSR/Server Actions keep secrets server-side; great Vercel DX       |
| Styling       | **CSS Modules**                                 | Scoped, no runtime, matches request                                |
| Icons         | **lucide-react**                                | Clean, consistent, tree-shakeable                                  |
| Backend DB    | **Neon Postgres**                               | Serverless Postgres, autoscaling, pooling, DB branching, free tier |
| ORM           | **Drizzle ORM**                                 | Type-safe, lightweight, first-class migrations, easy to test       |
| Hosting       | **Vercel**                                      | Native Next.js, preview deploys, edge network                      |
| Parent auth   | **Email + password** (no email/reset)           | Self-contained, no 3rd-party email dependency (see §5.2)           |
| Kid auth      | **Avatar + 4-digit PIN**                        | Remembered device by default, family-code fallback                 |
| Multi-tenancy | `family_id` on every row (+ Postgres RLS-ready) | Strict isolation, scalable                                         |
| Redemptions   | **Parent approval required**                    | Mirrors real life; prevents impulse/accidental spends              |
| Earning model | **Chore/behavior catalog** (+ custom award)     | One-tap awarding, kid-legible                                      |
| Scope         | **Multi-family**                                | Built to grow beyond one household                                 |

### 2.1 Why not Notion

Multi-family + non-technical onboarding + "configure everything in-app" is incompatible with
Notion: each family would need to create an integration token and share databases (a developer
task), and a shared workspace can't isolate families or survive Notion's ~3 req/s rate limit.
Postgres solves isolation, speed, and scale cleanly.

---

## 3. Architecture

```
                       ┌─────────────────────────────┐
                       │  Mobile browser / installed  │
                       │  PWA (Next.js client)        │
                       │  - CSS Modules, lucide        │
                       │  - Optimistic UI              │
                       │  - Service worker + manifest  │
                       └──────────────┬───────────────┘
                                      │  HTTPS (HTTP-only signed cookie)
                       ┌──────────────▼───────────────┐
                       │  Next.js server (Vercel)      │
                       │  - Server Actions / Route      │
                       │    Handlers (all DB access)    │
                       │  - Auth & session (jose JWT)   │
                       │  - Zod validation              │
                       │  - Drizzle queries             │
                       └──────────────┬───────────────┘
                                      │  pooled connection (DATABASE_URL)
                       ┌──────────────▼───────────────┐
                       │  Neon Postgres                 │
                       │  families / people / chores /  │
                       │  rewards / ledger / redemptions│
                       └────────────────────────────────┘
```

**Security invariants**

- The database URL and any secrets live only in server env vars; never shipped to the client.
- Every DB query is scoped by `family_id` taken from the **session**, never from client input.
- Passwords and PINs are hashed (argon2id); never stored or logged in plaintext.
- All mutations validate input with Zod and re-check authorization server-side.

---

## 4. Data model (Postgres / Drizzle)

> Money/points are integers. Timestamps are `timestamptz`. All IDs are `uuid` (v4) by default.
> Every domain row carries `family_id` for tenant isolation.

### 4.1 `families`

| column     | type        | notes                                                    |
| ---------- | ----------- | -------------------------------------------------------- |
| id         | uuid pk     |                                                          |
| name       | text        | "The Marshalls"                                          |
| code       | text unique | short, human-friendly join/login code (e.g. `MARSH-7Q2`) |
| created_at | timestamptz |                                                          |

### 4.2 `people`

| column          | type                 | notes                                           |
| --------------- | -------------------- | ----------------------------------------------- |
| id              | uuid pk              |                                                 |
| family_id       | uuid fk → families   |                                                 |
| role            | enum(`parent`,`kid`) |                                                 |
| name            | text                 | display name                                    |
| avatar          | text                 | emoji or preset key                             |
| color           | text                 | theme accent (hex/preset)                       |
| email           | citext nullable      | parents only, unique per app                    |
| password_hash   | text nullable        | parents only                                    |
| pin_hash        | text nullable        | kids (and optionally parents)                   |
| sort_order      | int                  | profile picker ordering                         |
| is_active       | boolean              | soft-disable instead of delete                  |
| consent_at      | timestamptz nullable | parents only — when guardian consent was given  |
| consent_version | text nullable        | parents only — ToS/Privacy version consented to |
| created_at      | timestamptz          |                                                 |

Indexes: `(family_id)`, unique `(email)` where not null.

### 4.3 `chores` (behavior catalog)

| column     | type        | notes                                                 |
| ---------- | ----------- | ----------------------------------------------------- |
| id         | uuid pk     |                                                       |
| family_id  | uuid fk     |                                                       |
| name       | text        | "Made bed"                                            |
| emoji      | text        | "🛏️"                                                  |
| points     | int         | default award value (can be overridden at award time) |
| is_active  | boolean     |                                                       |
| sort_order | int         |                                                       |
| created_at | timestamptz |                                                       |

### 4.4 `rewards`

| column      | type          | notes                |
| ----------- | ------------- | -------------------- |
| id          | uuid pk       |                      |
| family_id   | uuid fk       |                      |
| name        | text          | "30 min screen time" |
| emoji       | text          | "📺"                 |
| cost        | int           | points required      |
| description | text nullable |                      |
| is_active   | boolean       |                      |
| sort_order  | int           |                      |
| created_at  | timestamptz   |                      |

### 4.5 `ledger` (immutable points transactions — source of truth)

| column        | type                           | notes                                   |
| ------------- | ------------------------------ | --------------------------------------- |
| id            | uuid pk                        |                                         |
| family_id     | uuid fk                        |                                         |
| person_id     | uuid fk → people (the kid)     |                                         |
| amount        | int                            | **signed**: + earn, − redeem, ± adjust  |
| type          | enum(`earn`,`redeem`,`adjust`) |                                         |
| reason        | text                           | free text or chore/reward name snapshot |
| chore_id      | uuid fk nullable               | when type=earn from catalog             |
| reward_id     | uuid fk nullable               | when type=redeem                        |
| redemption_id | uuid fk nullable               | links to approved redemption            |
| created_by    | uuid fk → people (the parent)  | who awarded/approved                    |
| created_at    | timestamptz                    |                                         |

Ledger rows are **never updated or deleted**. Corrections are new `adjust` rows. This guarantees
auditability and a trustworthy history.

### 4.6 `redemptions` (approval workflow)

| column       | type                                                          | notes                               |
| ------------ | ------------------------------------------------------------- | ----------------------------------- |
| id           | uuid pk                                                       |                                     |
| family_id    | uuid fk                                                       |                                     |
| person_id    | uuid fk → people (the kid)                                    |                                     |
| reward_id    | uuid fk                                                       |                                     |
| reward_name  | text                                                          | snapshot (rewards may change later) |
| cost         | int                                                           | snapshot of cost at request time    |
| status       | enum(`requested`,`approved`,`fulfilled`,`denied`,`cancelled`) |                                     |
| requested_at | timestamptz                                                   |                                     |
| decided_by   | uuid fk nullable → people                                     | parent who approved/denied          |
| decided_at   | timestamptz nullable                                          | when approved/denied                |
| fulfilled_by | uuid fk nullable → people                                     | parent who marked delivered         |
| fulfilled_at | timestamptz nullable                                          | when reward was actually delivered  |
| note         | text nullable                                                 | optional parent note on decision    |

**Lifecycle:** `requested → approved → fulfilled` (happy path), or `requested → denied`, or
`requested → cancelled` (by kid/parent before a decision). **Points are deducted on `approved`**
(the ledger `redeem` row is written then); `fulfilled` is a later bookkeeping step meaning the
real-world reward was delivered — it does not touch the ledger. Parents see an "Awaiting delivery"
queue of approved-but-unfulfilled redemptions.

### 4.7 Derived values (not stored)

- **Balance** `= SUM(ledger.amount WHERE person_id = X)`
- **Reserved** `= SUM(redemptions.cost WHERE person_id = X AND status = 'requested')`
- **Available** `= Balance − Reserved` (what a kid can spend right now)

A kid can only request a redemption if `Available >= reward.cost`. On approval, we insert a
`redeem` ledger row (`amount = −cost`) and set status `approved`; on deny/cancel, the reservation
is released with no ledger change. Later, a parent may mark an approved redemption `fulfilled`
(no ledger effect). All ledger writes run in a single DB transaction.

**Negative balances are allowed.** A parent `adjust` (or, in edge cases, a correction) may take a
kid below zero — supporting a "debt you earn back" style. Balance is _not_ floored. Kid-facing UI
shows negative balances clearly (e.g. red) and disables redemption requests while `Available < 0`.

---

## 5. Authentication & sessions

### 5.1 Session

- Stateless signed JWT (via `jose`) in an **HTTP-only, Secure, SameSite=Lax** cookie.
- Payload: `{ familyId, personId, role, ver }`. Short access lifetime (e.g. 30 days sliding for a
  family device is acceptable; configurable). `ver` allows global invalidation.
- Middleware guards routes by role; server actions re-check `role`/`family_id` from the session.

### 5.2 Parent flows

- **Sign up**: email, password (zxcvbn strength check), parent display name → creates `families`
  row + parent `people` row, signs in.
- **Sign in**: email + password (argon2id verify).
- **No email-based password reset.** Pointsy deliberately ships **no email dependency**: there is
  no transactional-email provider and no reset-link flow. A parent who is locked out is
  re-provisioned by an admin/co-parent. (This is a settled decision, not a deferral — see §13.)

### 5.3 Kid flows

- **Remembered device** (default): device stores `familyId` locally (not a credential — just which
  family this device belongs to). App shows the family's profile picker → tap avatar → enter PIN.
- **Family-code fallback**: enter family `code` → profile picker → PIN. Lets a kid log in on a new
  device or switch families on a shared device.
- PINs are 4 digits, argon2id-hashed, rate-limited (lockout after N failed attempts per person).

### 5.4 Authorization matrix

| Action                            | Parent         | Kid       |
| --------------------------------- | -------------- | --------- |
| Award / adjust points             | ✅             | ❌        |
| Create/edit chores & rewards      | ✅             | ❌        |
| Approve/deny redemptions          | ✅             | ❌        |
| Manage people / PINs / co-parents | ✅             | ❌        |
| Family settings                   | ✅             | ❌        |
| View own balance & history        | ✅ (all kids)  | ✅ (self) |
| Browse rewards                    | ✅             | ✅        |
| Request redemption                | ✅ (on behalf) | ✅ (self) |
| Cancel own pending request        | ✅             | ✅        |

---

## 6. Screens & UX

Mobile-first (single column, large tap targets ≥44px, bottom nav, thumb-reachable primary
actions). Sleek, modern, lots of whitespace, playful color per kid. Dark mode supported.

### 6.1 Auth / onboarding

1. **Welcome** — Sign in / Create a family.
2. **Create family** — family name → parent name, email, password, plus a required
   parent/guardian-consent checkbox (links to ToS/Privacy; consent timestamp recorded).
3. **Add kids** — name, avatar (emoji picker), color, 4-digit PIN. Repeatable.
4. **Seed templates** (optional) — one tap to add starter chores & rewards.
5. **Done** — "This device will remember your family." → parent dashboard.

### 6.2 Profile picker (remembered device)

- Grid of avatars (kids + parents). Tap → PIN pad (kid) or password (parent, or parent PIN if set).
- "Use a family code" link for the fallback path. "Add another family" for shared devices.

### 6.3 Parent — Home / Dashboard

- Per-kid cards: avatar, name, **big balance**, available vs reserved, quick "Award" button.
- **Pending approvals** banner/section with approve/deny.
- **Awaiting delivery** list (approved-but-unfulfilled) with a one-tap "Mark delivered".
- Bottom nav: **Home · Award · Rewards · Activity · Admin**.

### 6.4 Parent — Award points

- Pick kid (skip if entered from a kid card).
- **Chore catalog grid** (emoji + name + points). Tap one or many → running total → Confirm.
- "Custom" option: amount + reason. Optimistic update + toast with undo (soft undo = `adjust`).

### 6.5 Parent — Rewards & Chores management

- Tabs: **Rewards** / **Chores**. List with drag-reorder, active toggle, edit, add.
- Edit sheet: emoji, name, points/cost, description, active.

### 6.6 Parent — Activity

- Family-wide ledger feed, filter by kid/type/date. Each entry: who, what, ±points, when.
- Redemptions sub-view with statuses.

### 6.7 Parent — Admin

- Manage kids (edit, reset PIN, deactivate).
- Invite co-parent (email invite or shared family code with parent role).
- Family settings (name, code regeneration, theme), data export (CSV/JSON), danger zone.

### 6.8 Kid — Home

- Huge balance with a satisfying count-up animation. Avatar + name.
- "Available to spend" if any pending reservations.
- Quick links: **Redeem** and **My history**.
- Recent activity (last few earns/redeems) with emoji.

### 6.9 Kid — Redeem

- Reward grid. Affordable rewards highlighted; unaffordable show "X more points 🔒".
- Tap reward → confirm → **Requested** state (pending parent approval). Can cancel while pending.

### 6.10 Kid — History

- Personal ledger feed, friendly language ("You earned 10 for Homework 🎉").

### 6.11 Cross-cutting UX

- Optimistic updates with rollback on error; non-blocking toasts.
- Empty states with guidance ("No rewards yet — ask a parent!").
- Skeleton loaders; never a blank screen.
- Haptic-feel micro-animations on award/redeem (respect `prefers-reduced-motion`).
- Full PWA: installable, offline shell, "you're offline" banner for actions needing network.

---

## 7. API / server surface

Implemented primarily as **Server Actions** (mutations) and **Route Handlers** (any client-fetch
needs, webhooks, health). All validate with Zod and derive `family_id`/`role` from the session.

### 7.1 Auth

- `signUp(familyName, parentName, email, password)`
- `signIn(email, password)`
- `signInKid(familyId|code, personId, pin)`
- `signOut()`
- Co-parents join via a one-time **invite code** (`inviteCoParent` → `acceptInvite`); there is
  **no email-based password reset** (see §5.2).

### 7.2 People

- `addKid(...)`, `updatePerson(...)`, `setPin(personId, pin)`, `deactivatePerson(id)`
- `inviteCoParent(email)` / `acceptInvite(token)`
- `exportFamilyData()` → JSON/CSV of all `family_id`-scoped rows (right to access)
- `deleteFamily()` → hard-deletes the family and every `family_id`-scoped row (right to erasure)

### 7.3 Catalog

- `createChore / updateChore / reorderChores / toggleChore`
- `createReward / updateReward / reorderRewards / toggleReward`

### 7.4 Points & redemptions

- `awardPoints(kidId, items[] | {amount, reason})` → ledger rows (transactional)
- `adjustPoints(kidId, amount, reason)`
- `requestRedemption(kidId, rewardId)` → checks `Available >= cost`, creates `requested`
- `cancelRedemption(redemptionId)`
- `decideRedemption(redemptionId, 'approved'|'denied', note?)` → transactional ledger + status
- `fulfillRedemption(redemptionId)` → set `fulfilled` (real-world delivery; no ledger change)
- `getBalance(kidId)`, `listActivity(filters)`, `listPendingRedemptions()`, `listAwaitingFulfillment()`

### 7.5 Health / ops

- `GET /api/health` — DB connectivity check for uptime monitoring.

---

## 8. Project structure

```
pointsy/
├─ app/
│  ├─ (auth)/                 # welcome, sign-in, create-family, profile-picker
│  ├─ (parent)/               # dashboard, award, rewards, chores, activity, admin
│  ├─ (kid)/                  # home, redeem, history
│  ├─ api/health/route.ts
│  ├─ layout.tsx, globals.css, manifest.ts
│  └─ actions/                # server actions grouped by domain
├─ lib/
│  ├─ db/                     # drizzle schema, client, migrations
│  ├─ auth/                   # session (jose), hashing (argon2), guards
│  ├─ domain/                 # balance, redemption, award logic (pure, unit-tested)
│  ├─ validation/             # zod schemas
│  └─ utils/
├─ components/                # ui primitives + feature components (+ *.module.css)
├─ public/                    # icons, manifest assets, service worker
├─ tests/
│  ├─ unit/                   # vitest (domain, utils)
│  ├─ integration/            # vitest + pglite (actions against real SQL)
│  └─ e2e/                    # playwright
├─ drizzle/                   # generated migrations
├─ .claude/                   # rules, skills, commands, agents (see §11)
├─ .github/workflows/         # CI/CD (see §10)
├─ CLAUDE.md                  # house rules for Claude
├─ SPEC.md                    # this file
└─ README.md
```

---

## 9. Quality: testing, accessibility, performance

### 9.1 Testing strategy (pyramid)

- **Unit (Vitest)**: pure domain logic — balance math, available/reserved, redemption rules,
  PIN/password hashing wrappers, Zod schemas. Fast, no DB.
- **Integration (Vitest + pglite)**: run server actions against an in-memory Postgres
  (`@electric-sql/pglite`) with real migrations — verifies SQL, transactions, tenant isolation.
  No Docker needed; runs in CI in seconds.
- **E2E (Playwright)**: full flows on a real build against a disposable **Neon branch** DB —
  sign up → add kid → award → kid redeem → parent approve → balances update. Mobile viewport
  projects (iPhone/Pixel) + desktop.
- **Accessibility**: `@axe-core/playwright` assertions on every key screen; Testing Library
  queries by role/label to enforce semantic markup.
- **Coverage gate**: domain/lib ≥ 90%; overall ≥ 70% (tunable).

### 9.2 Test data isolation

- Each integration test creates its own family; assertions confirm cross-family queries return
  nothing (tenant-isolation tests are first-class).

### 9.3 Accessibility targets (WCAG 2.1 AA)

- Semantic landmarks, labeled controls, focus management on route/sheet changes.
- Color contrast AA; never color-only signaling.
- Full keyboard operability; visible focus rings.
- `prefers-reduced-motion` respected; PIN pad reachable by screen readers.

### 9.4 Performance

- Server Components by default; minimal client JS.
- Optimistic UI for awards/redemptions; cache reads with `revalidateTag`.
- Lighthouse CI budgets: Performance ≥ 90, A11y ≥ 95, PWA installable. Enforced in CI.
- Neon pooled connections; avoid N+1 via Drizzle joins/aggregates.

---

## 10. CI/CD, GitHub workflows & versioning

### 10.1 GitHub Actions

- **`ci.yml`** (on PR + push): install → typecheck (`tsc --noEmit`) → lint (ESLint) →
  format check (Prettier) → unit + integration (Vitest, pglite) → build.
- **`e2e.yml`** (on PR): provision ephemeral Neon branch → migrate → `next build` →
  Playwright (mobile + desktop) + axe → tear down branch. Uploads traces on failure.
- **`lighthouse.yml`** (on PR preview): run Lighthouse CI against the Vercel preview URL,
  assert budgets.
- **`release.yml`** (on push to `main`): Changesets → version bump + changelog + GitHub release
  - tag. Vercel auto-deploys `main` to production.
- **`codeql.yml`** (security scanning) + Dependabot for dependency updates.

### 10.2 Branch protection

- PRs required; CI + E2E must pass; at least one review (Claude `/code-review` can gate).
- Conventional Commits enforced (commitlint) to drive Changesets/semver.

### 10.3 Versioning

- **Changesets** + **SemVer**. Every PR with user-facing change includes a changeset.
- Auto-generated `CHANGELOG.md`; GitHub Releases per version.

### 10.4 Environments & secrets

- `DATABASE_URL` (Neon pooled), `AUTH_SECRET` (JWT signing), and an optional Web Push VAPID
  keypair (`NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`). No email/transactional-mail keys.
- Vercel: Production + Preview environments. Neon: main branch (prod) + per-PR branches (E2E).
- `.env.example` documents all required vars.

---

## 11. Claude automation (.claude/)

The repo is configured so Claude can review, clarify, spec, implement, test, and ship with minimal
human steps. **All scoped to this project.**

### 11.1 `CLAUDE.md` — house rules

- Architecture invariants (server-only DB access; always scope by `family_id` from session;
  ledger is append-only; balances are derived).
- Conventions: TypeScript strict, CSS Modules naming, lucide for all icons, Zod at every boundary.
- "Definition of done": typecheck + lint + unit/integration green, a11y checks pass, changeset
  added, screens verified in a mobile viewport.
- Security rules: never log secrets/PINs; never expose `DATABASE_URL`/`AUTH_SECRET` client-side.

### 11.2 Skills (`.claude/skills/`)

- **`spec-feature`** — turn a request into a mini-spec: clarifying questions, edge cases, data &
  UI impact, test plan, before writing code.
- **`implement-feature`** — implement against the spec following house rules; wire action +
  validation + UI + tests together.
- **`db-migration`** — author a Drizzle schema change + migration safely (additive-first, tenant
  isolation preserved, backfill plan).
- **`review-pr`** — structured review (correctness, security/tenant-isolation, a11y, perf, tests).
- **`a11y-audit`** — run axe on changed screens, report and fix.

### 11.3 Commands (`.claude/commands/`)

- `/new-feature`, `/migrate`, `/release`, `/verify` (build + run + screenshot key flows).

### 11.4 Agents / workflows

- A review workflow: dimensions (correctness, security, a11y, perf) → adversarial verify →
  synthesis, runnable before merge.
- Optional scheduled "dependency & changelog tidy" agent.

### 11.5 Definition of automation

- Lint/format on commit (lint-staged + husky).
- CI blocks merge on any failure.
- Claude can self-serve: spec → branch → implement → test → open PR → review → address feedback.

---

## 12. Phased delivery plan

**Phase 0 — Scaffold**
Next.js + TS + CSS Modules + lucide; Drizzle + Neon; ESLint/Prettier; Vitest/Playwright; CI;
`.claude/` rules & skills; PWA manifest/service worker; `.env.example`.

**Phase 1 — Auth & multi-tenancy**
Sign up/in (parent), session cookie, family creation, tenant-isolation tests.

**Phase 2 — People & profile picker**
Add/manage kids, PIN auth, remembered device + family-code fallback.

**Phase 3 — Catalog**
Chores & rewards CRUD with reorder/active.

**Phase 4 — Points engine**
Award (catalog + custom), adjust, ledger, balance/available — fully unit + integration tested.

**Phase 5 — Redemptions**
Request → reserve → approve/deny → ledger; kid redeem UI; parent approvals.

**Phase 6 — Polish**
Dashboards, activity feeds, animations, dark mode, empty/skeleton states, Lighthouse budgets.

**Phase 7 — Ship**
Production Neon, Vercel deploy, README/onboarding docs, first release via Changesets.

**Shipped since v1** (now part of the app — see `CHANGELOG.md`)
Web Push notifications, co-parent invites, kid-submitted chores + approval, chore categories /
limits / rotation / checklists / core chores, challenges (weekly + parent approval), and team-up
rewards.

**Post-v1 candidates** (not email — see §13)
Recurring/scheduled chores, badges, allowance auto-credit, photo proof for chores, CSV import,
i18n.

---

## 13. Confirmed product decisions

1. **Parent PIN on shared device** — ✅ Yes. Parents may set an optional quick PIN for fast
   re-entry on a trusted, already-set-up device; the full password is still required for new
   devices and sensitive admin actions (regenerate family code, delete data, manage co-parents).
2. **Email service** — ❌ Out of scope (settled, not deferred). Pointsy ships **no email
   dependency** at all: co-parents join via a one-time invite **code**, and there is no
   email-based password reset (a locked-out parent is re-provisioned by an admin/co-parent).
3. **Negative balances** — ✅ Allowed. `adjust` may take a kid below zero ("debt you earn back");
   balance is not floored. UI shows negatives clearly and blocks redemptions while `Available < 0`.
4. **Reward fulfillment** — ✅ Tracked. Lifecycle adds a `fulfilled` state: points deduct on
   `approved`; a parent later marks the redemption `fulfilled` once the reward is delivered
   (no ledger effect). See §4.6.

### Remaining minor open item

- **Templates** — preset chore/reward starter packs. Assumed: one generic starter pack in v1;
  age-range packs are a post-v1 nicety. Flag if you'd like multiple packs at launch.
