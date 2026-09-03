# R326 — keep the /documents type filter in the URL across refresh and share

## Evidence

- Rezi changelog 2026-08 Week 4 (first-hand): "Seamless Messaging Navigation:
  Navigate to messages or refresh the page without losing your place." —
  refresh-safe context is their product bar. We already applied it to /jobs
  (R312) and /samples (R324); the R324 plan explicitly listed the /documents
  docKind filter as the remaining candidate.
- Source (Dashboard.tsx): `docKind` is pure `useState('all')` — the
  Cover letters / Interview prep / Resignation letters chips reset on refresh
  and can't be shared. Production confirmed via the R324/R325 QA harness
  observations (filter state lost on reload).

## Design (mirror of R324, minimal)

- Extend the existing `/samples` seed to `/documents`: seedParams is read when
  `section === 'samples' || section === 'documents'`; `?kind=` seeds `docKind`
  (validated against the literal kind union; anything else → 'all').
- Derived `activeDocKind`: seeded/current kind falls back to 'all' when no doc
  of that kind exists (chips for empty kinds are already hidden), no
  setState-in-effect (same lesson as R324's activeSector).
- Write-back effect only when `section === 'documents'`:
  `history.replaceState`, default ('all') omitted ⇒ bare /documents URL.
- /dashboard inline documents section unchanged (anchor-based semantics).
- Delete-last-of-kind fallback keeps working (state reset already exists; the
  derived value covers the seeded case too).

## Out of scope

- Dashboard folder/sort state; preview-dialog deep links (future candidates).

## QA (production, zero real AI)

Seed docs of ≥2 kinds → click chips, URL gains/loses ?kind=; hard refresh and
new-tab deep link restore the filter; invalid ?kind=x falls back to All and
cleans the URL; ?kind= for a kind with no docs falls back to All; /dashboard
#documents anchor behavior unchanged; 375 strict; dark mode; baseline restore.
