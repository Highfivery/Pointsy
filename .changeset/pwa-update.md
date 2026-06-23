---
"pointsy": patch
---

Make the installed PWA reliable. Add the iOS `apple-touch-icon` and
`apple-mobile-web-app` metadata so the Home Screen shows the Pointsy icon (iOS
ignores the web manifest for this). Add a service-worker auto-updater that checks
for a new version on load and when the app regains focus and reloads once it
takes control — so each release reaches the installed app without reinstalling
(this is why new icons weren't appearing).
