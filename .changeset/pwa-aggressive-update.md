---
"pointsy": patch
---

Make the installed PWA update itself more reliably. The app now checks for a new
version on load, on focus, and on an interval, actively promotes a waiting service
worker (so a stuck one can't keep serving an old build), and reloads once the new
worker takes over — so releases reach the home-screen app without a manual
reinstall. (iOS still only refreshes the home-screen _icon_ on reinstall.)
