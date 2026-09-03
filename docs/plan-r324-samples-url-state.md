# R324 — keep /samples filters in the URL across refresh and share

## Evidence

- Rezi changelog 2026-08 Week 4, "Seamless Messaging Navigation: Navigate to
  messages or refresh the page without losing your place" — refresh-safe
  context is a stated product bar; R312 already applied it to /jobs.
- Source (Dashboard.tsx): the Sample library filters — `exampleQuery`,
  `exampleSector`, `savedOnly` — are plain `useState`, never read from or
  written to the URL. On /samples a refresh or shared link loses the search,
  industry chip, and Saved toggle (production-confirmed: filter, reload,
  filters reset).

## Design (R312 pattern, /samples route only)

- Seed once from `window.location.search` when `section === 'samples'`:
  `?q=` → exampleQuery, `?sector=` → exampleSector (validated against the
  loaded sector list once examples arrive; invalid → All), `?saved=1` →
  savedOnly.
- Write-back effect (only when `section === 'samples'`) with
  `history.replaceState`; defaults omitted (empty q, sector All, saved off ⇒
  clean bare URL).
- /dashboard's inline samples section keeps its current stateful behavior —
  its URL semantics are anchor-based (#samples) and shared with two other
  sections.

## Out of scope

/documents docKind filter (single low-cardinality toggle, candidate later),
dashboard folder/sort state, preview-dialog deep links.

## Validation

tsc/eslint/build; deploy + cache-busted bundle check; production QA: set all
three filters on /samples → URL reflects them → hard refresh restores filters
and result set; deep-link with ?q&sector&saved=1 straight in; invalid sector
falls back to All; bare URL stays clean; /dashboard samples section
unaffected; 375 strict; dark mode; baseline restore; zero AI.
