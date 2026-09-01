# R148 — Audit chip on collapsed entry cards (Rezi-style per-entry checklist visibility)

## Rezi first-hand evidence (2026-08-31, app.rezi.ai, public pages only)

- On the Experience editor page (`/dashboard/resume/<id>/experience`), the left sidebar lists
  each experience entry with a **per-entry audit checklist attached to the entry itself**, visible
  without opening the entry form: "Weak Bullet Points", "Dates are missing", "Number of Bullet
  Points", "Quantified Bullet Points", plus an expandable positive state "3 best practices applied".
- Each failed audit shows a red/amber status dot; passing practices roll up into a green summary.
- Observed on Experience entries. Whether other sections show the same list is **unverified**
  (only one sample resume available); extending to Education/Projects below is an inference from
  the shared card pattern, kept minimal.

## RezUp today / gap

- R126 made Experience/Education/Projects entries collapsible cards with identity headers.
- Bullet lint (`checkBullets`), the 3–6 bullet-count note, and the "Dates are missing" warning
  render **only inside the expanded card** (`BulletGuidance`, inline warnings).
- Gap: once a card is collapsed, all of its writing/completeness warnings become invisible —
  a user tidying a long resume has to reopen every card to find which entry still has issues.
  Rezi keeps per-entry audit status visible at the entry-list level.

## Plan

Pure UI derivation — zero schema change, zero storage, no export/preview/ATS change.

- Add a small helper computing an entry's finding list from existing rules (reusing
  `checkBullets` — no new lint rules):
  - Experience: per-line bullet issues + bullet-count note (3–6, when the entry is filled)
    + "Dates are missing" (filled entry without a start date). Same rules already shown expanded.
  - Education: "Dates are missing" (filled entry without a start date).
  - Projects: per-line issues on the description lines (same input R139 lints).
- In the card header (after the Hidden badge), **only while the card is collapsed**, render:
  - amber chip `⚠ N` when N findings exist — `title` lists the findings, clicking it expands
    the card (same `toggleEntry`), `aria-label` describes it;
  - green `✓` chip when the entry is filled and clean (mirrors Rezi's "best practices applied").
- Expanded cards keep the existing inline warnings; the chip hides to avoid duplication.

## Non-goals

- No Rezi PRO audits (personal pronouns, buzzwords, passive voice, filler words) — R139's rule
  set stays as is.
- No new lint rules, no schema/localStorage keys, no change to share/dashboard/exports.

## Verification

- `npm run lint`, `npm run build` locally.
- Production QA at 1440px and 375px: chip appears only when collapsed, counts match the
  expanded warnings, click-to-expand works, ✓ state for clean filled entries, hidden/drag/sort
  (R126/R145/R146) regressions.
