---
"pointsy": patch
---

Two parent/kid-facing fixes:

- **PIN pad now reacts to a wrong entry.** A rejected PIN flashes the dots red
  and shakes them, then clears the pad so the next attempt visibly starts fresh.
  Previously a repeated wrong PIN (identical error text) could leave the pad full
  and unresponsive with no feedback. The flash honours `prefers-reduced-motion`.

- **Award screen can deduct points, not just award them.** The custom-points card
  gains an Award / Deduct segmented toggle, so a parent enters a plain positive
  amount and the button restates the action ("Award points" / "Deduct points") —
  no more typing a minus sign into an "adjust" field. Deductions are recorded as
  negative `adjust` ledger rows, keeping the ledger append-only.
