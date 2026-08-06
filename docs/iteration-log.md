# Iteration log

Continuous improvement loop. Each round: five drivers (QA testing, UX walkthrough,
frontend/visual & accessibility analysis, competitor research, user/data analytics)
→ P0/P1/P2 triage → fix → deploy → verify live → next round.

## Round 1 — 2026-08-06

**Drivers & findings**

| # | Driver | Finding | Priority |
|---|--------|---------|----------|
| 1 | QA (route sweep) | Unknown URLs (e.g. `/nonexistent-page-xyz`) returned HTTP 200 with the SPA shell — soft-404s that waste crawl budget and can hurt indexing | P1 |
| 2 | Visual/a11y (axe-core on live site) | `/builder`: 3 icon-only delete buttons had no accessible name (critical); 3 drag handles used `aria-label` on generic `<span>` (prohibited); page had no `<h1>` | P1 |
| 3 | Visual/a11y (axe-core) | Landing: empty `<th>` in comparison table; heading order jumped h1→h3 in features grid | P2 |
| 4 | SEO/UX | `/builder` and `/ats-checker` shared the homepage `<title>`/description (SPA, no per-route meta); `index.html` had no canonical/OG tags | P1 |
| 5 | Data (analytics.mjs, 7d) | 5 PV / 5 UV (all QA traffic), 3 email leads (all test) — no organic yet; homepage meta still said "pay $9.99" while the site is in free launch mode | P2 |

**Fixes shipped** (worker version `f88b0aaa`)

- Worker now returns real **404** (with SPA shell body) for unknown paths; SPA routes
  (`/`, `/builder`, `/ats-checker`) still get 200. `not_found_handling` switched
  `single-page-application` → `none`.
- Builder: delete buttons got `title` + `aria-label`; drag handles got `role="button"`;
  sr-only `<h1>` added.
- Landing: sr-only "Feature" table header; sr-only `<h2>` for the features section.
- Per-route `<title>` + meta description via `usePageMeta` (Landing / Builder / ATS checker).
- `index.html`: canonical + OpenGraph/Twitter tags; description aligned with free launch mode.

**Verification (live)**

- `curl`: `/nonexistent-page-xyz` → 404, SPA routes → 200, static pSEO pages → 200, `/api/nope` → 404 JSON.
- axe-core rerun on `/`, `/builder`, `/ats-checker`: **0 violations** (was 6 across 3 pages).
- Per-route titles confirmed in live browser.

**Data snapshot**: 7d PV 5 / UV 5 (QA), leads 3 (test).
