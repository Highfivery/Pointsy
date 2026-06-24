---
"pointsy": patch
---

Fix two reported bugs:

- **Chore frequency wouldn't reset to Unlimited (#56).** The add form and every
  edit card reused the same element ids, so an edit form's "How often" label
  targeted the wrong control and the "Times per day" field appeared stuck. Ids
  are now unique per instance.
- **"Strange blue bar" on kid sign-in (#65).** The points-earned celebration was
  an indigo toast that read as a random bar. It's now a clear, centered
  "🎉 +N points!" card with confetti and a "Yay!" button — non-blocking,
  dismissible, and reduced-motion aware.
