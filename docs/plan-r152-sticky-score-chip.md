# R152 — Persistent score chip in the sticky section navigator

## Rezi evidence (first-hand, 2026-08-31)

On app.rezi.ai the editor keeps the Rezi Score permanently visible while you work:

- The Finish Up & Preview page pins a score gauge (number + "Needs improvement"
  label, 0–100 arc) at the top of the right sidebar; it stays visible while the
  resume scrolls and updates live as content changes (observed 2 → 7 → 44 as the
  sample resume gained content).
- An "Explore My Rezi score" button under the gauge opens the full Rezi Score
  modal (category tabs, per-check explanations, affected entries).
- Earlier audits saw the same persistent score panel on the per-section editor
  pages, so the score is visible from anywhere in the editor.

## RezUp gap

RezUp has an equivalent full report (resume health, 6 dimensions, findings with
Fix→ jumps) but its entry point is a "Full health report — N/100" link inside the
Resume strength card at the very top of the edit column. As soon as the user
scrolls into the form the score disappears; nothing in the viewport shows how the
resume is doing or invites them back into the report. The R151 sticky section
navigator is the natural place for an always-visible score.

## Plan

Add a compact score chip pinned at the right edge of the R151 sticky
`SectionNav` bar:

- Shows the live `health.score` (0–100) with the same color semantics as the
  strength bar (emerald ≥ 80, amber ≥ 50, red below).
- Clicking it opens the existing full health report dialog (same handler as the
  "Full health report" link, including the `honestcv.seen.health` marker).
- The chip sits outside the horizontally scrollable chip strip so it stays
  visible even when section chips overflow on 375 px; strip and chip share the
  sticky container (flex row, chip `shrink-0`, strip keeps `overflow-x-auto`).
- `aria-label` announces "Resume health score N out of 100 — open full report".
- Touch target ≥ 40 px on mobile (`min-h-10 sm:min-h-8`, matching R151 chips).

No schema, storage, dependency, export, ATS, AI, or share changes. `health` is
already computed in the Builder render path, so no extra computation.

## Acceptance

- 1440/1600 px: score chip visible at the right end of the sticky bar at all
  scroll positions of the edit column; click opens the health report dialog.
- 375 px: chip remains pinned while section chips scroll under it; no page-level
  horizontal overflow; tap target ≥ 40 px.
- Score updates live when content changes (e.g. clearing the summary lowers it).
- Existing R151 behaviors (chip jump, active highlight, dynamic optional
  sections) unchanged; "Full health report" link in the strength card unchanged.
