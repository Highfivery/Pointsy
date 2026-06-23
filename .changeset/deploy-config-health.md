---
"pointsy": patch
---

Add a `/api/health` endpoint that verifies database connectivity (for uptime
monitoring), plus Vercel deploy config (`vercel.json` build command + Node 22
`engines`) and dotenv-powered local migrations so `npm run db:migrate` reads
`.env.local` (preferring the direct/unpooled URL).
