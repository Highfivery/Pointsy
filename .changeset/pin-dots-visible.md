---
"pointsy": patch
---

Fix invisible PIN dots. The empty PIN slots were filled with the near-black
`--color-border`, so on the dark background they vanished — when the pad was
empty (including right after a wrong PIN cleared it) there was no visible cue
where digits go. Empty slots are now clearly visible hollow rings that fill solid
emerald as you type, flash red on a wrong attempt, then return to visible rings.
