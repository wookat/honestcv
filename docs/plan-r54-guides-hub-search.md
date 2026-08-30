# R54 — Search filter on the guides hub

## First-hand evidence (2026-08-29, ~/audit-r1/shots-r54/)

- Rezi's blog hub (`rezi-blog-full.png`) leads with a topic tab bar so its
  large article catalog is navigable by intent.
- Our `/guides/` hub (`rezup-guides-full.png`) lists 40+ guides as grouped
  text links with no way to narrow them; R50 added exactly this affordance
  to `/examples/`, so the guides hub is now the only large static catalog
  without a filter.

Gap: **P2, landing/content dimension.**

## Design (static `/guides/` page only)

Reuse the R50 progressive-enhancement pattern unchanged:

- `hubPage()` gains an optional `filterEmpty` message so the empty state can
  say "No guides match…" instead of the examples-specific copy.
- The `/guides/` hub entry sets
  `filterPlaceholder: 'Search guides — ATS, keywords, gap, cover letter…'`
  and a guides-appropriate `filterEmpty`.
- `public/hub-filter.js` already operates generically on `main ul.features`
  (title text matching, group-heading hiding, empty state) — no JS changes.
- Strict CSP compatible (external same-origin script, no inline JS); with JS
  disabled the input stays `hidden`, page unchanged.

## Deliberately NOT copied

- Rezi's blog card grid with cover images (no honest imagery per guide; the
  grouped text list with blurbs reads faster for reference content).
- Topic tabs (our groups already segment; search covers cross-group intent).
