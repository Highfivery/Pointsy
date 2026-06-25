---
"pointsy": minor
---

Rewards can be marked as **team rewards**. In the reward editor, a "Team reward"
toggle (with a minimum number of kids) flags a reward that several kids redeem
together by splitting the cost evenly. This lays the groundwork — the kid
propose / opt-in and parent approval flow follows next. Under the hood: an
even-split helper, reserve-aware availability so each kid's share is held while a
team-up is pending, and an idempotent per-member payout on approval.
