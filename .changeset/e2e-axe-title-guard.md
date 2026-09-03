---
"pointsy": patch
---

test(e2e): wait for the soft-nav title before scanning with axe

The catalog and put-back specs called axe straight after a client-side
navigation, so a run could sample the document while the App Router was still
applying `<title>` and fail with a spurious `document-title` violation on
`/manage/chores` and `/award`. Both specs now await a non-empty title inside
their axe helper, the same guard `points.spec.ts` already used inline.
