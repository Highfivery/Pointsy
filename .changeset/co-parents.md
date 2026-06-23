---
"pointsy": minor
---

Add co-parents: a parent can invite another parent to share the family
dashboard. The inviting parent generates a one-time, 72-hour invite **code**
(shown once, shared by them — the app never emails it); the co-parent redeems it
at a new `/join` page by creating their own email + password login and agreeing
to consent. A new "Parents" screen lists grown-ups (with Owner/You badges),
shows pending invites with revoke, and lets the **owner** (the family creator,
who can't be removed) remove co-parents. Role isolation and the keep-at-least-one
guarantee are enforced.
