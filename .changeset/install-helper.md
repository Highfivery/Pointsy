---
"pointsy": minor
---

Add a PWA install helper so people can add Pointsy to their home screen easily.
A dismissible "Install Pointsy" banner appears for non-installed visitors and a
quiet "Install app" link sits in the footer. On Android/desktop it triggers the
native install prompt; on iOS (which can't) it opens a clear Add-to-Home-Screen
guide — including the easily-missed "tap Show More" step. It hides itself once
installed or when installing isn't supported.
