---
"pointsy": patch
---

Fix the PWA showing a previous session's screen on first open after closing the
app — e.g. tapping "Parent? Sign in" landing on the last kid's dashboard. The
service worker was caching authenticated HTML/RSC and serving it stale on cold
start. It now caches only static assets (JS, CSS, images, fonts) and always
fetches pages from the network, so the server's session logic decides what
renders. Old page caches are purged when the new worker activates.
