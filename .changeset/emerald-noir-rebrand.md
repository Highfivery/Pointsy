---
"pointsy": minor
---

Rebrand to a dark, modern "Emerald Noir" design system and standardise the UI.

- **New look:** a dark-only theme with an emerald→cyan gradient accent, glassy
  elevated surfaces, the Sora display + Inter body typefaces, and tasteful motion
  (page fades, count-up balances, staggered list entrances, press feedback) — all
  respecting `prefers-reduced-motion`. Accessibility target moves from WCAG AAA to
  AA (still fully AA-conformant).
- **Shared components:** a single set of primitives (`Card`, `IconButton`, `Chip`,
  `ScreenHeader`, `BottomNav`) now backs every card and screen for consistency.
- **Manage screens:** each of Rewards, Chores, Challenges and Kids gains a
  contextual bottom nav (`Dashboard · Section · Add`), a dedicated "Add" page, and
  fully-contained cards with inline icon actions (edit / hide / delete, etc.).
  Chores can be filtered by category.
- **Challenges:** the end date is now optional when a challenge repeats every week,
  so weekly challenges can run indefinitely.
