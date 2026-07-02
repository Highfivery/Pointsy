---
"pointsy": minor
---

feat(points): put back a completed chore from the activity feed (#145)

Parents can now undo a completed chore straight from the Recent activity list
on the award screen. Putting a chore back reverses the points with a linked
correction (the ledger stays append-only), flips the kid's approved submission
back so the chore reads as not complete, frees its daily/weekly claim slot,
and removes it from streaks, daily-goal, and challenge progress until it's
completed and approved again. The put-back entry stays visible — struck
through with a "Put back" label — on both the parent and kid feeds, and the
kid gets a heads-up notification.
