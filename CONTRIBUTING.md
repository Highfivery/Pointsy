# Contributing to Pointsy

Thanks for helping build Pointsy! This project is designed to be built largely
with Claude, so the conventions are encoded in [`AGENTS.md`](AGENTS.md) and the
skills under [`.claude/`](.claude). Please read [SPEC.md](SPEC.md) first.

## Workflow

1. **Branch** off `main` — `feat/<slug>`, `fix/<slug>`, etc. Never commit to
   `main` directly.
2. **Build** following the invariants in `AGENTS.md`:
   - Server-only data access; scope every query by the session's `familyId`.
   - Ledger is append-only; balances are derived.
   - Validate every input with Zod; hash secrets; never log them.
3. **Test** — unit (`lib/domain`), integration (PGlite, incl. tenant isolation),
   and E2E + axe for new screens.
4. **Accessibility** — meet the WCAG 2.1 **AA** checklist in
   [`docs/accessibility.md`](docs/accessibility.md).
5. **Changeset** — run `npm run changeset` for any user-facing change.
6. **Open a PR** — fill in the template. Checks run locally, not on GitHub
   Actions: `npm run verify:full` must pass before you merge.

## Quality gate (all local)

```bash
npm run verify          # typecheck, lint, format, tests + coverage, build
npm run test:e2e:local  # Playwright + axe on a throwaway Postgres (needs Docker)
npm run verify:full     # both — required before merging
npm run lighthouse      # optional: performance/a11y budgets on a production build
```

A pre-push hook runs typecheck, lint, format and tests automatically.

## Releasing

From an up-to-date `main` with pending changesets, run `npm run release`. It
bumps the version, writes `CHANGELOG.md`, and opens a `release/vX.Y.Z` PR.
Merge it; Vercel deploys `main` and applies migrations.

## Commit messages

[Conventional Commits](https://www.conventionalcommits.org/), enforced by
commitlint: `feat:`, `fix:`, `docs:`, `refactor:`, `perf:`, `test:`, `build:`,
`ci:`, `chore:`, `revert:`.

## Using Claude

Slash commands available in this repo:

- `/new-feature <description>` — spec → implement → review → a11y.
- `/migrate <change>` — safe schema change + migration.
- `/verify` — run the full local quality gate.
- `/release` — prepare a Changesets release.
