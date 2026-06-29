---
"pointsy": patch
---

Render the PIN dots as solid filled circles that can't collapse on iOS. The
previous empty-`<span>`-with-border construct rendered in desktop WebKit but
could vanish on a real iPhone; the dots are now solid fills with `flex: 0 0 20px`
so all four positions always show.
