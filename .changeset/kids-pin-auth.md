---
"pointsy": minor
---

Add kids and PIN-based sign-in. Parents can manage child profiles (name, avatar,
color, 4-digit PIN) with edit, reset-PIN, and deactivate/reactivate. Kids sign in
through an avatar profile picker plus their PIN on a remembered device (with a
family-code fallback), landing on a minimal kid home. PIN attempts are
rate-limited with a lockout after repeated failures.
