---
"pointsy": patch
---

Polish the award/deduct points card: the "Points awarded/deducted" confirmation
now hides itself if you switch direction without submitting, so it always
matches the toggle. Internally, the award-vs-deduct routing is centralised in a
`changePoints` service function (single source of truth for the sign) with a
direct integration test.
