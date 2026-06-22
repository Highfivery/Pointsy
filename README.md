# Pointsy

A simple, sleek, mobile-first **PWA** where parents award points to kids for
chores and good habits, and kids redeem those points for rewards. Multi-family,
self-onboarding, open-source.

> **Status:** early development (Phase 0 scaffold complete). See
> [SPEC.md](SPEC.md) for the full product & technical specification and the
> phased delivery plan.

## Highlights

- **Multi-family SaaS** — one deployment serves many families, each isolated by
  `familyId`. Families self-sign-up; no per-family setup.
- **Parents** award points from a chore/behavior catalog and approve redemptions.
- **Kids** sign in with an avatar + PIN on a remembered device, watch their
  points grow, and request rewards (parent-approved).
- **Trustworthy points** — balances are derived from an append-only ledger and
  can never silently drift.
- **Accessible** — targets WCAG 2.1 **AAA** where applicable (see
  [docs/accessibility.md](docs/accessibility.md)).
- **Kids' privacy by design** — only parents have accounts/PII; kids are just a
  name + avatar + PIN.

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · CSS Modules · lucide-react ·
Neon Postgres + Drizzle ORM · jose + argon2 (auth) · Zod · Serwist (PWA) ·
Vitest + PGlite + Playwright/axe · GitHub Actions · Changesets.

## Getting started

Requires **Node 22+** (see `.nvmrc`).

```bash
nvm use            # Node 22
npm install
cp .env.example .env.local   # then fill in DATABASE_URL and AUTH_SECRET
npm run db:migrate           # apply migrations to your Neon database
npm run dev                  # http://localhost:3000
```

### Setting up the database (Neon)

1. Create a free Postgres database at [neon.tech](https://neon.tech).
2. Copy the **pooled** connection string into `DATABASE_URL` in `.env.local`.
3. Generate an `AUTH_SECRET`: `openssl rand -base64 48`.
4. Run `npm run db:migrate`.

## Scripts

| Command                           | Description                                      |
| --------------------------------- | ------------------------------------------------ |
| `npm run dev`                     | Start the dev server (Turbopack)                 |
| `npm run build`                   | Production build (webpack — required by Serwist) |
| `npm run typecheck`               | `tsc --noEmit`                                   |
| `npm run lint` / `npm run format` | ESLint / Prettier                                |
| `npm test`                        | Unit + integration tests (Vitest + PGlite)       |
| `npm run test:coverage`           | Tests with coverage                              |
| `npm run test:e2e`                | Playwright E2E + axe accessibility checks        |
| `npm run db:generate`             | Generate a Drizzle migration from schema changes |
| `npm run db:migrate`              | Apply migrations                                 |
| `npm run icons:generate`          | Regenerate PWA icons from `public/icon.svg`      |
| `npm run changeset`               | Add a changeset for a user-facing change         |

## Quality & automation

- **CI** (`.github/workflows/ci.yml`): typecheck, lint, format, unit + integration
  tests, build.
- **E2E** (`e2e.yml`): Playwright across mobile + desktop with axe assertions.
- **Lighthouse** (`lighthouse.yml`): performance/accessibility budgets on PRs.
- **Release** (`release.yml`): Changesets-driven versioning + changelog.
- **CodeQL** + **Dependabot**: security scanning and dependency updates.
- **`.claude/`**: house rules (`AGENTS.md`), skills, and slash commands so the
  app can be built, reviewed, and shipped with Claude following the project's
  conventions.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). In short: branch off `main`, use
Conventional Commits, add tests + a changeset, and keep CI green.

## License

[MIT](LICENSE) © Highfivery
