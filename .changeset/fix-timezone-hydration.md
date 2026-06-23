---
"pointsy": patch
---

Fix a hydration mismatch in the dashboard's family-timezone control: it used
`Intl.supportedValuesOf("timeZone")` during render, and the server's and
browser's IANA lists can differ, which mismatched the rendered options. It now
uses a deterministic curated list of common zones (the exact zone is still
auto-detected). Resolves intermittent flakiness on WebKit.
