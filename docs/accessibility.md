# Accessibility — WCAG 2.1 AA

Pointsy targets **WCAG 2.1 Level AA** for all criteria that apply to its content.
The app uses a single **dark theme** ("Emerald Noir"); colours are tuned for AA
contrast on that palette. Where a criterion genuinely cannot be met, it is
documented in the "Known exceptions" section below.

> Automated tools (axe) only validate a subset of rules (mainly contrast). The
> rest is enforced by design tokens, the ESLint `jsx-a11y` strict ruleset, and the
> manual checklist here — which the Claude `a11y-audit` skill runs on changed UI.

## Enforcement layers

1. **Design tokens** (`app/globals.css`) — every text/UI color meets the AA 4.5:1
   contrast ratio (1.4.3) for normal text, 3:1 for large text/UI. Verify before
   adding any new color. Gradient/decorative text (e.g. the big balance number) is
   exempt and must never carry essential information by colour alone.
2. **ESLint** — `jsx-a11y` strict config + tightened rules (`eslint.config.mjs`).
3. **Automated checks** — `@axe-core/playwright` runs on every key screen in E2E,
   tagged for `wcag2a`, `wcag2aa`, `wcag21aa`.
4. **Manual checklist** — the list below, reviewed per PR that touches UI.

## Per-screen manual checklist

- [ ] **1.4.3 Contrast (Minimum)** — text ≥ 4.5:1, large text ≥ 3:1.
- [ ] **1.4.8 Visual Presentation** — body text not justified; line spacing ≥ 1.5;
      content reflows without horizontal scroll at 320px.
- [ ] **2.1.1 Keyboard** — every action reachable & operable by keyboard only.
- [ ] **2.4.7 / 2.4.11 Focus Visible/Appearance** — clear, high-contrast focus ring.
- [ ] **2.4.8 Location** — user always knows where they are (active nav state).
- [ ] **2.4.13 Focus Not Obscured** — focused element never hidden behind sticky UI.
- [ ] **2.5.5 Target Size** — interactive targets ≥ 44×44px.
- [ ] **3.2.5 Change on Request** — no surprise context changes; actions are explicit.
- [ ] **3.3.x Forms** — labels, clear error messages, error prevention on destructive
      actions (confirm before deleting a family/kid).
- [ ] **1.3.1 Info & Relationships** — semantic HTML, landmarks, headings in order.
- [ ] **4.1.2 Name/Role/Value** — all custom controls expose correct ARIA.
- [ ] **Reduced motion** — animations gated behind `prefers-reduced-motion`.
- [ ] **Screen reader pass** — VoiceOver (iOS/macOS) sweep of the new flow.

## Known exceptions

_None yet. Document any AAA criterion that cannot be met here, with rationale._
