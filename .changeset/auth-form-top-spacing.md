---
"pointsy": patch
---

fix(auth): consistent top spacing across the sign-in / sign-up / join forms

The auth form card was vertically centred, so a short form (sign-in, two
fields) dropped lower than a tall one (sign-up / join), making the gap between
the header and the page title look different on each page. The card is now
anchored to a consistent top offset, so that gap is identical on every form.
