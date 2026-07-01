---
"pointsy": patch
---

fix(marketing): UI/UX polish across the marketing surfaces

- **Header** collapses to the menu earlier (960px) and never wraps — nav links
  and "Parent sign in" are `nowrap`.
- **Consistent content width** on the content pages (compare, guides, about):
  every block aligns to one column so the right edges are no longer ragged.
- **Homepage gutters** — filled cards (privacy, final CTA) now keep a guaranteed
  side gutter and align with the content above, so nothing runs to the edge.
- **FAQ sections are centered** across all pages.
- **"debit card" → "credit card"** throughout the copy.
- **Removed the redundant logo** above the sign-up / sign-in / join forms (the
  global header already shows it).
- **Redesigned the `/enter` screen** with a proper branded card, logo lockup,
  and trust footnote.
- **Added a horizontal-overflow layout guardrail** (Playwright) that checks every
  marketing page at six widths, so edge-to-edge regressions are caught in CI.
