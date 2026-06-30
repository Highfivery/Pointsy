---
"pointsy": minor
---

feat(marketing): redesigned homepage, global site header & footer

Launch-ready marketing polish:

- **Homepage redesign** — product screenshots in a phone-mockup hero, a trust
  strip, a "Why Pointsy vs debit-card apps" comparison table, a focused
  6-feature grid, a screenshot showcase, challenge/team-up splits, a privacy
  section, accessible FAQ accordions, and a strong closing CTA. Leads with the
  free / points-not-money / no-app-store / privacy-first positioning.
- **Global `SiteHeader`** — a sticky, glassy header shared by the marketing,
  legal, and auth pages, so `/privacy` and `/terms` finally have a way home.
- **Redesigned `SiteFooter`** — a modern multi-column footer (Product · Get
  started · Company) with brand, trust pills, and links. Scoped to the public
  surfaces; the authenticated app screens keep their bottom-nav chrome.
- **Entity SEO** — site-wide `Organization` JSON-LD (with `legalName` and
  `sameAs`) to establish Pointsy/Highfivery as a recognised entity for search
  and AI assistants.
- **GitHub Pages** — `docs/index.html` now redirects to pointsy.kids
  (instant meta-refresh + canonical) instead of serving a stale mirror.
- **Content / SEO pages** — a free interactive **points-to-reward calculator**
  (`/tools/reward-calculator`), a **comparison hub** (`/compare`), and
  per-competitor comparison pages (`/compare/greenlight`, `/compare/busykid`,
  `/compare/famzoo`) built from a shared data model, each with answer-first
  copy, a comparison table, an honest "when a card app is better" balance,
  `BreadcrumbList` + `FAQPage` JSON-LD, and sitemap entries. Linked from a new
  header "Compare" item and a footer "Resources" column.
