---
"pointsy": minor
---

fix(redemptions): make a claimed reward clearly "waiting for a grown-up"

Claiming a reward reserves the points until a parent approves (points still
leave the ledger only on approval), but the kid's home screen gave no sign of
it: the balance was unchanged, the goal card reset to near-zero, and the same
reward could be claimed again — so it looked like nothing happened.

Now:

- A reward the kid has already requested shows a calm "Requested — waiting for
  a grown-up" state (amber) with a full progress bar, instead of collapsing —
  requesting a reward never erases its own progress.
- Goal progress is measured against the kid's balance minus points reserved for
  _other_ pending rewards, so an unrelated hold no longer wipes out a bar.
- The balance card explains the gap ("0 to spend · 10 on hold"), and pending
  reward requests now appear on the home screen with a way to cancel them, not
  just on the Rewards page.
- A reward can't be requested twice while one request is still pending, and the
  affordability check is serialised per kid so two fast taps can't over-reserve.
