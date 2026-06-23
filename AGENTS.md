<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Pointsy — house rules for Claude

Pointsy is a free, multi-tenant, mobile-first PWA where parents award points to
kids for chores and kids redeem them for rewards. **Read [SPEC.md](SPEC.md)** for
the full product/technical spec; it is the source of truth. This file is the
condensed set of rules to follow while building.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript (strict) · CSS Modules ·
lucide-react · Neon Postgres + Drizzle ORM · jose (sessions) · argon2 (hashing) ·
Zod (validation) · Serwist (PWA) · Vitest + PGlite + Playwright/axe.

## Non-negotiable architecture invariants

1. **Server-only data access.** All DB/Notion-equivalent access happens in Server
   Actions / Route Handlers. The `DATABASE_URL` and `AUTH_SECRET` must never reach
   the client. Never `"use client"` a module that imports `lib/db/*`.
2. **Tenant isolation.** Every query is scoped by `familyId` taken from the
   **session** (`getSession()`), never from client-supplied input. Add an
   integration test asserting isolation for any new table/query.
3. **Ledger is append-only.** Balances are derived (`SUM(ledger.amount)`), never
   stored. Corrections are new `adjust` rows. Never UPDATE/DELETE ledger rows.
4. **Balances may be negative** (no floor). UI must show negatives clearly and
   block redemptions while `available < 0`.
5. **Snapshot on write.** Redemptions store `rewardName`/`cost` at request time;
   points deduct on `approved`; `fulfilled` is a later non-ledger step.
6. **Validate every boundary** with a Zod schema from `lib/validation`.
7. **Hash secrets.** Passwords and PINs go through `lib/auth/password`. Never log
   or return them. Rate-limit PIN/password attempts.
8. **Never show auth chrome to a known user.** A signed-in user — or any device
   already associated with a family (the `pointsy_family` cookie) — must **never**
   see the marketing page, a sign-in form, or a "re-enter your family code" step
   as the home screen. The root `/` resolves to the PIN-gated family **profile
   picker** for known devices and marketing **only** for brand-new ones. Any change
   to routing/entry/auth must keep an E2E asserting this for both states.

## Conventions

- **Icons:** always `lucide-react`. No other icon sets, no inline SVG icons.
- **Styling:** CSS Modules (`*.module.css`) only — no Tailwind, no CSS-in-JS.
  Use the design tokens in `app/globals.css` (never hard-code colors; new colors
  must meet AAA 7:1 contrast).
- **Build uses webpack** (`npm run build` → `next build --webpack`) because
  Serwist injects a webpack config. Dev uses Turbopack with the SW disabled.
- **Pure logic** (points math, code generation) lives in `lib/domain` and is unit
  tested with no I/O.

## Accessibility — WCAG 2.1 AAA where applicable

Follow `docs/accessibility.md`. Semantic HTML, labelled controls, visible focus,
≥44px targets, `prefers-reduced-motion` honoured, 7:1 contrast. Run the
`a11y-audit` skill on any changed screen.

## Testing

- `lib/domain/**` → Vitest unit tests (≥90% coverage).
- Server actions / SQL → integration tests via PGlite (`tests/helpers/test-db.ts`),
  including a tenant-isolation assertion.
- User flows → Playwright in `tests/e2e`, each key screen asserted with axe
  (tags `wcag2a`, `wcag2aa`, `wcag21aa`, `wcag2aaa`).

## Definition of Done

`npm run typecheck` · `npm run lint` · `npm run format:check` · `npm test` all
green; tests added; a11y checked; a changeset added for user-facing changes;
verified in a mobile viewport.

**Look at the UI before you ship it.** For any change that touches a screen,
actually render it and look — don't ship UI you've only reasoned about. Run the
app (or Playwright against a throwaway Postgres) and capture a screenshot of each
affected screen in **both** states it can be in (e.g. signed-out vs known-device,
empty vs populated, light vs dark), confirm it matches intent, and include the
screenshots in the PR. "Typecheck passes" is **not** UI verification.

## Workflow & commits

- Branch off `main`; never commit directly to `main`.
- **Conventional Commits** (enforced by commitlint): `feat:`, `fix:`, `docs:`,
  `refactor:`, `test:`, `chore:`, `ci:`, etc.
- Run `npm run changeset` for any user-facing change.
- Open a PR; CI + E2E must pass. Use the `review-pr` skill before requesting review.

## Common commands

| Task                      | Command                                                 |
| ------------------------- | ------------------------------------------------------- |
| Dev server                | `npm run dev`                                           |
| Typecheck / lint / format | `npm run typecheck` · `npm run lint` · `npm run format` |
| Unit + integration tests  | `npm test` (`npm run test:coverage`)                    |
| E2E                       | `npm run test:e2e`                                      |
| Generate migration        | `npm run db:generate`                                   |
| Apply migration           | `npm run db:migrate`                                    |
| Regenerate PWA icons      | `npm run icons:generate`                                |
| Add a changeset           | `npm run changeset`                                     |

## Skills available (`.claude/skills/`)

`spec-feature`, `implement-feature`, `db-migration`, `review-pr`, `a11y-audit`.
Prefer them — they encode these rules step by step.
