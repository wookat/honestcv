# R303 — exploratory production audit: scan-only PDF import paths + seam walk

## Evidence

- R301 audit closed with one explicitly untested path: "scan-only PDF import error path
  (missing fixture)". Rezi's checker rejects non-parseable/scanned resumes with a clear
  message; our four upload surfaces each have a scanned-image guard in source
  (Landing `handleFile`, Dashboard `handleImportFile`/`handleImportDocFile`,
  Builder import dialog, AtsChecker `handleFile`) — but "code exists" ≠ "verified":
  none has ever been exercised against a real image-only PDF in production.
- Fixture now exists: `/home/ubuntu/qa/scan_only_resume.pdf` (PIL-generated image-only
  page; pdfminer extracts zero text — verified locally).

## Scope

Audit round (R290/R295/R301 pattern): no planned code change; fix any P0–P2 found
same round, log P3s and fix if small.

1. Scan-only PDF against all four upload surfaces on production:
   - Landing drop zone → inline error, no navigation, no crash.
   - Dashboard "Import a resume" → inline error, no resume created.
   - Dashboard "Import a cover letter" → inline error, no career doc created.
   - /ats-checker upload → error surfaced, no bogus score; file checks not shown
     for a failed extract.
   - Builder import dialog → inline error, resume state untouched.
2. Seam walk while there: oversized-file check message (fixture >2MB not required —
   skip if impractical), unsupported extension (.png) error on each surface,
   busy-state reset after error (button re-enabled, spinner gone).
3. Regressions: normal text PDF import still works (existing fixture), 375px + dark
   mode on any dialog showing the new/observed errors.

## Out of scope

- OCR of scanned resumes (deliberate non-goal; error message is the product answer).
- Any AI request (audit must consume zero quota).
