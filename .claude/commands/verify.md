---
description: Run the full local quality gate for Pointsy and report results.
---

Run Pointsy's quality gate and report a concise pass/fail summary. Stop and show
the failure if any step fails; fix straightforward issues and re-run.

1. `npm run typecheck`
2. `npm run lint`
3. `npm run format:check`
4. `npm run test:coverage`
5. `npm run build`
6. `npm run test:e2e` (if Playwright browsers are installed locally)

Summarize what passed, what failed, and any coverage or accessibility findings.
