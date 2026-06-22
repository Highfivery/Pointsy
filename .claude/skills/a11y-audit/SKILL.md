---
name: a11y-audit
description: Audit changed Pointsy screens against the WCAG 2.1 AAA checklist (automated axe + manual review) and fix issues. Use whenever UI is added or changed.
---

# Accessibility audit (AAA where applicable)

## Automated

1. Ensure an e2e test for each changed screen runs:
   `new AxeBuilder({ page }).withTags(["wcag2a","wcag2aa","wcag21aa","wcag2aaa"])`.
2. Run `npm run test:e2e` (or the specific spec). Fix every violation; axe
   reports zero false positives for our rule set.

## Manual checklist (per changed screen) — from `docs/accessibility.md`

- [ ] 1.4.6 Contrast ≥ 7:1 (text) — uses design tokens, no hard-coded colors.
- [ ] 1.4.8 Reflows at 320px, line-height ≥ 1.5, text not justified.
- [ ] 2.1.1 Fully keyboard operable; logical tab order.
- [ ] 2.4.7/2.4.11 Visible, high-contrast focus; not obscured by sticky UI.
- [ ] 2.5.5 Targets ≥ 44×44px.
- [ ] 3.3.x Inputs labelled; clear errors; confirm before destructive actions.
- [ ] 1.3.1/4.1.2 Semantic landmarks/headings; custom controls expose name/role/value.
- [ ] Motion gated behind `prefers-reduced-motion`.
- [ ] VoiceOver sweep of the new flow.

## Output

List issues found, the fix applied, and any AAA criterion that genuinely can't be
met (record it under "Known exceptions" in `docs/accessibility.md` with rationale).
