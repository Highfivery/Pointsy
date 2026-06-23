---
"pointsy": minor
---

Fix the home page for signed-in users and harden route authorization.

- The homepage now resolves the family from the **session first**, device cookie
  second — so a logged-in person always lands on the family profile picker, never
  the marketing page, even on a device whose cookie predates the picker. The proxy
  also heals the device→family cookie for older sessions.
- **Security:** enforce role isolation on protected routes. A kid session can no
  longer open a parent route (`/dashboard`, `/manage`, `/award`) by URL (and a
  parent can't open kid routes) — enforced in the proxy and re-checked in each
  page. Previously `/dashboard` accepted any session regardless of role.
