---
"pointsy": patch
---

Render the PIN dots as SVG circles. Styled HTML elements for the dots could fail
to paint on some real iOS devices even when they rendered fine everywhere else;
SVG `<circle>`s render identically across devices, so the four dots now always
show (empty = muted sage, filled = emerald, wrong attempt = rose + shake).
