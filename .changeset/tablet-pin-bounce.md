---
"pointsy": patch
---

Fix kids being sent back to the profile picker on tablets. Tapping a name on a
Wi-Fi-only tablet showed the PIN pad, then the app reloaded itself the moment
Wi-Fi reconnected and threw the kid back to the picker. The app no longer
reloads when the network comes back, and the picker now remembers the tapped
profile for two minutes, so any reload lands back on the PIN pad.
