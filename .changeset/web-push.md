---
"pointsy": minor
---

Add opt-in Web Push notifications. Parents and kids can enable notifications
from the dashboard / kid home; the app then alerts parents when a child requests
a reward, and alerts a child when they earn points or a reward is approved.
Backed by a new `push_subscriptions` table, a VAPID-gated sender (a graceful
no-op until the keys are configured), and a service-worker push handler.
