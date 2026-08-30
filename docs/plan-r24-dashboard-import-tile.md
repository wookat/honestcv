# R24 — Dashboard: import-a-resume tile + "Edited … ago" timestamps

Date: 2026-08-29 · Round: R24 · Prior: R23 (#236 career doc filters)

## First-hand evidence (2026-08-29 re-audit, logged-in capture `~/audit-r1/shots-r24/`)

Rezi `app.rezi.ai/dashboard/resumes`:
- Create card reads **"Click to create new resume _or drop a resume here_"** —
  the resumes workspace itself is an import target.
- Resume cards show relative edit time: **"Edited 3 hours ago"**.

RezUp `/dashboard` today: no import path at all (import lives in the Builder
dialog; R22's hero drop goes to the ATS checker, not into a resume). Version
cards show an absolute date (`toLocaleDateString`).
Gap class: 操作台 P1 (import) + P2 (timestamps).

## Scope

1. **Import tile** in the My resumes grid (rendered after the version cards):
   dashed card "Import a resume — click or drop a PDF, DOCX or TXT here".
   - Click opens a file picker (`IMPORT_ACCEPT`); drag-over highlights; drop
     accepted. Extraction via existing `extractTextFromFile`, structure via
     existing `parseResumeText` — all browser-side.
   - If no draft exists: parsed resume becomes the draft (`saveResume`) and we
     navigate to `/builder`.
   - If a draft exists: reuse the existing "open a copy" protection — confirm
     dialog offering "Save draft as a copy first" / "Replace draft" (same
     semantics as `confirmOpen` for versions).
   - <30 chars of extracted text → inline error on the tile (scanned image
     case), stay on dashboard.
2. **Relative timestamps** on resume cards: `Edited today / 1 day ago / N days
   ago` replacing the absolute date (helper mirrors `agoFromMs` in Jobs.tsx).

## Out of scope
- No storage change; no Worker change; hero drop (R22) and Builder import
  dialog unchanged.

## Acceptance
- 1440px: click-import PDF lands parsed content in /builder; draft-exists path
  shows the confirm dialog; error path stays inline.
- 375px: tile ≥40px target, no overflow.
- Regression: existing cards' Open/Duplicate/Rename/Delete unchanged.
- Local lint/tsc/build green; PR based on R23 branch; deploy; prod QA 1440+375.
