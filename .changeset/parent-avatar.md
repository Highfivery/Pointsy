---
"pointsy": patch
---

Parents now default to a neutral person avatar instead of an unrendered emoji
(which showed as a generic fallback icon in the profile picker). Adds a "Person"
icon to the avatar set, defaults both the family creator and invited co-parents
to it, fixes the stale `people.avatar` column default, and backfills existing
parents.
