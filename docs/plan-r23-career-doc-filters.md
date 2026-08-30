# R23 — Career documents: per-type tabs with counts

Date: 2026-08-29 · Round: R23 · Prior: R22 (#235 hero resume drop)

## First-hand evidence

Rezi workspace sidebar (login capture `~/audit-r1/shots-r15/`, also in R21 notes)
separates document types as top-level sections: **RESUMES / COVER LETTERS /
RESIGNATION LETTERS** — each type has its own list. RezUp's dashboard shows one
mixed "Career documents" list (cover letters, interview briefs and resignation
letters interleaved, newest first) with no way to see just one type.
Gap class: 操作台 P2 (grows with document count).

## Scope

1. Dashboard "Career documents" section: filter tab row under the heading —
   `All (n) · Cover letters (n) · Interview prep (n) · Resignation letters (n)`.
   - Tabs render only when there are saved docs; counts from the loaded list.
   - Zero-count type tabs are hidden (no dead tabs).
   - Selected tab filters the list client-side; "All" is default.
   - Same pill pattern as the Sample library industry filters (visual reuse).
2. Empty filtered state impossible by construction (zero-count tabs hidden);
   deleting the last doc of the selected type falls back to All.

## Out of scope
- No storage change (`honestcv.careerDocs` untouched), no new routes,
  no WorkspaceNav change.

## Acceptance
- 1440px: tabs show correct counts; switching filters the list; delete updates
  counts and falls back to All when a type empties.
- 375px: tabs wrap, ≥40px touch targets, no overflow.
- Regression: Open/Delete/copy dialogs unchanged.
- Local lint/tsc/build green; PR based on R22 branch; deploy; prod QA.
