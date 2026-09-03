---
"pointsy": patch
---

fix(points): "Also give to" now covers awarding and deducting points, not just chores

Picking another child under "Also give to" only applied to one-tap chores. The
picker sat inside the chore board, below the "Award or deduct points" form, so
typing an amount and a reason there quietly went to one child — the extra pick
was ignored (issue #159).

The picker now sits above both, and everything on the screen goes to everyone
picked:

- Custom awards **and** deductions apply to every picked child, in one
  transaction — they all land or none do.
- The submit button names them ("Award to Robin and Andy", "Deduct from Robin
  and Andy") so it's clear before you commit, and the confirmation names them
  back ("Points awarded to Robin and Andy!").
- A line under the picker spells out its reach: "Points and chores below apply
  to Robin and Andy."
