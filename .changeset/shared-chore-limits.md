---
"pointsy": minor
---

Add a per-kid vs shared scope to chore claim limits. A chore's limit can now
either apply to each kid (the existing behaviour, now clearly labelled "… each")
or be a shared family-wide total ("… · shared") that's first come, first served
— once it's been claimed the allowed number of times by anyone, it's gone for
everyone that day/week. Kids see how many shared slots are left, and a chore
another kid already claimed shows "<name> got it first" instead of the green
"Done". Shared and "Core" are mutually exclusive. Claims are serialised so two
kids can't both slip past a cap of one.
