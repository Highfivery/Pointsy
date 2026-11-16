---
description: Run the full local quality gate for Pointsy and report results.
---

Run Pointsy's quality gate and report a concise pass/fail summary. There is no
GitHub CI — this local run is the gate. Stop and show the failure if any step
fails; fix straightforward issues and re-run.

1. `npm run verify` — typecheck, lint, format check, tests with coverage, build
2. `npm run test:e2e:local` — full Playwright + axe suite on a throwaway
   Postgres container (needs Docker). Rerun only failures with
   `npm run test:e2e:local -- --last-failed` before calling a failure real.

Summarize what passed, what failed, and any coverage or accessibility findings.
