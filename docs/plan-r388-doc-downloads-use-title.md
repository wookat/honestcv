# R388 — SOP-10 audit + dashboard document downloads named after the document

## SOP-10 audit (production, 2026-08-31)

Four-dimension audit on cv.zalize.com (bundles index-D_WU3gkg.js / AtsChecker-Bw9jzvjH.js),
all sensitive requests mocked pre-dispatch, baseline restored. Zero P0/P1. Findings:

- **P2 — ATS score differs between /ats-checker and Builder for the same content.**
  `scoreResumeText` (raw text heuristics) and `scoreResume` (structured resume) apply
  different check sets and text reconstructions, so the score changes right after
  "Fix it in the builder". Local probe: same resume/JD → 96 vs 93 (heuristic drift in
  structure checks); QA saw 100 vs 67 on a minimal seed. Convergence needs a design
  round (shared check harness or honest messaging at the handoff) — banked, not fixed here.
- **P3 (fixed this round)** — dashboard document downloads ignore the document title:
  every cover letter exports as `<name>-cover-letter.<ext>` regardless of which document
  it is. Since R363 (rename) and R365 (duplicate) users can hold many distinguishable
  documents; their exports are indistinguishable on disk. The Builder tool dialog already
  names cover letters `<name>-<company>-cover-letter.<ext>`.
- P3 — `/jobs?tab=tracked&job=<bogus>` rewrites the param to an auto-selected feed job
  instead of stripping it (cosmetic; banked).
- P3 — stale `honestcv.activeVersionId` persists after the bound copy is deleted
  (harmless; every reader treats it as unbound; banked).
- QA incident: one real AI request escaped when a CDP session closed with a paused
  request (releases it); lesson recorded in the testing skill. Quota-full 402 UI path
  remains untested.

## Fix (this round)

`src/pages/Dashboard.tsx` `docDownload` only: build the filename from the document
title instead of the generic kind slug:

```ts
const name = professionalFileName([letterhead.contact.fullName, d.title], fmt)
```

Titles default to `"<company> — Cover letter"` etc., so default exports become
`jamie-tester-acme-corp-cover-letter.txt` and renamed documents export under their
own name. Covers card row + viewer footer, all three formats (PDF/DOCX/TXT).

## Non-goals

- Builder tool-dialog filenames (already company-aware) unchanged.
- No scorer unification (P2 banked for a dedicated round).
