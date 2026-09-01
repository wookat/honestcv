# R189 — File-level ATS format checks on uploaded resumes

## Evidence (first-party, public)

Rezi public Resume Checker page (https://www.rezi.ai/tools/resume-checker, fetched 2026-08-31):

> "ATS-compatibility guardrails — Detect hidden formatting issues—like improper fonts,
> tables, and headers—that can break ATS parsing. Fix them instantly with clear,
> automated recommendations."

> "The tool evaluates your resume against 23 critical ATS checkpoints—from file type and
> font size to keyword density and section headers."

## Gap

Our /ats-checker accepts PDF/DOCX/TXT uploads but immediately discards everything except
the extracted plain text. Hidden file-level ATS hazards — tables, text boxes, images,
content in Word headers/footers, multi-column PDF layouts, oversized files, too many
pages — are invisible to the user even though we already parse the file structures
(pdfjs page/text geometry, DOCX XML) that reveal them.

## Plan

1. `src/lib/extractFile.ts`: new `extractResumeFile(file)` returning
   `{ text, checks: FileCheck[] }` (FileCheck = { label, pass, hint }); keep
   `extractTextFromFile` as a thin wrapper so Builder/Dashboard/Landing are untouched.
   - Common: file size ≤ 2 MB.
   - PDF: page count ≤ 2; single-column layout (reuse `detectColumnSplit`); no embedded
     images (operator list paintImageXObject / paintInlineImageXObject).
   - DOCX: no tables (`<w:tbl>`); no text boxes (`<w:txbxContent>`); no images
     (`<w:drawing>`); no text hidden in headers/footers (word/header*.xml / footer*.xml
     containing real `<w:t>` text).
   - TXT: size check only.
2. `src/pages/AtsChecker.tsx`: store `{ fileName, checks }` from the upload and render an
   "Uploaded file checks" list (same pass/fail icon style as Format & content checks)
   inside the result card; new upload replaces it, it stays labeled with the filename.

## Constraints

- Deterministic, browser-only; zero AI calls, zero schema/Worker changes.
- Scoring formula untouched — file checks are informational and NOT folded into
  structureScore/keywordScore.
- Responsive 1440/375; dark mode via existing semantic tokens.

## Acceptance

- Upload a DOCX with a table/image/header contact line → corresponding checks fail with
  actionable hints; clean single-column PDF ≤ 2 pages → all pass.
- Paste-only flow unchanged (no file checks section).
- lint/typecheck/build green; production QA at 1440/375 including dark mode.
