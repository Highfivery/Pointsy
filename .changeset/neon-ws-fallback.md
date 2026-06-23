---
"pointsy": patch
---

Fix database connections failing on Node versions before 22 (e.g. local `npm run
dev` on Node 20). The neon-serverless driver requires a WebSocket; we now fall
back to the `ws` package when no global `WebSocket` is available, so the app
works on any Node version while still using native WebSocket on Node 22+/Vercel.
