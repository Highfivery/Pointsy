---
name: review-pr
description: Structured review of a Pointsy change before merge across correctness, security/tenant-isolation, accessibility, performance, and tests. Use before requesting review or merging.
---

# Review a change

Review the current diff (`git diff main...HEAD`) across these dimensions and
report findings grouped by severity (blocker / should-fix / nit). Verify claims
against the code — don't assume.

## Dimensions

1. **Correctness** — logic, edge cases (negatives, zero, concurrency), error
   handling, optimistic-update rollback.
2. **Security & tenant isolation** — every query scoped by session `familyId`;
   no `familyId`/`personId` trusted from client input; authz checks
   (`requireParent`) present; no secret/PIN logged or sent to the client; inputs
   Zod-validated; points mutations transactional.
3. **Data integrity** — ledger append-only; balances derived; snapshots stored;
   migrations additive and reviewed.
4. **Accessibility** — semantic markup, labels, focus, ≥44px targets, 7:1
   contrast, reduced motion. (Run `a11y-audit` for changed screens.)
5. **Performance** — Server Components by default, no N+1 queries, cached reads.
6. **Tests** — unit for domain, integration incl. isolation, e2e + axe; meaningful
   assertions; coverage targets met.
7. **Conventions** — CSS Modules + tokens, lucide icons, Conventional Commit,
   changeset present.

End with a clear verdict: **Approve**, **Approve with nits**, or **Request changes**.
