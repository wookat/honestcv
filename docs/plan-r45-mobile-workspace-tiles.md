# R45 — Mobile dashboard quick-access tiles (AI assistant + Job search)

Date: 2026-08-30 · Round: R45 · Status: planned

## Evidence

Logged-in mobile (375px) re-audit of app.rezi.ai (~/audit-r1/shots-r45/):

- `r45-rezi-resumes.png` — Rezi's mobile dashboard body opens with two
  first-class feature tiles above the resume grid: **AI Resume Agent** ("Our
  most powerful AI resume tool") and **Job Search** ("+2M jobs sourced from
  career pages"), plus a "Make content. Get paid" promo.
- `r45-ours-dashboard-m.png` — our mobile /dashboard body: My resumes,
  Career documents, Sample library, plan card (R44). The assistant and the
  jobs board are reachable **only** through the hamburger menu; nothing in
  the page body surfaces them.
- Desktop is fine: `WorkspaceNav` sidebar lists both (hidden `<md`).

## Gap

On phones our two deepest differentiators (assistant, job search + pipeline)
are invisible unless the user opens the hamburger. Rezi treats them as the
top of the mobile workspace. P1 (mobile parity is a hard acceptance bar).

## Batch (smallest honest slice)

On /dashboard, above "My resumes", render a `md:hidden` two-tile block:

1. **AI assistant** — "Chat about your resume, get targeted suggestions" →
   `/builder?assistant=1` (existing deep link, zero AI cost to open).
2. **Job search** — "Remote jobs + your application pipeline" → `/jobs`.

Implementation: plain `Link` cards (icon + title + one-line description,
`min-h` ≥ 40px), same card styling as the rest of the dashboard; no new
state, storage, endpoints, or AI calls.

## Deliberately not doing

- "Make content. Get paid" tile (no such program — would be fake).
- Duplicate tiles on /jobs (it already IS the job search; assistant is one
  hamburger tap away and adding cross-promos there clutters the board).
- Desktop changes (sidebar already covers this).

## QA (production, after deploy)

- 375px /dashboard: both tiles visible above My resumes; tapping AI assistant
  opens /builder with the panel auto-open and consumes zero AI credits;
  tapping Job search lands on /jobs; tap targets ≥40px; no overflow.
- 1440px: tiles hidden; sidebar unchanged; no duplicates.
- Console clean; localStorage restored byte-for-byte; qa.* keys removed.
