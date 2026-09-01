# R207 — Font-level ATS checks (size + icon glyphs) on uploaded resume files

## Rezi first-party evidence

- Rezi public Resume Checker page (`rezi.ai/tools/resume-checker`, verified R189):
  - "Detect hidden formatting issues—like **improper fonts**, tables, and
    headers—that can break ATS parsing."
  - "23 critical ATS checkpoints—from file type and **font size** to…"

## Current RezUp behavior

- R189 `extractResumeFile` file checks cover size, page count, columns,
  images (PDF) and tables/text boxes/images/header-footer text (DOCX) — but
  nothing font-related. A resume set in 7pt text, or using icon-font glyphs
  (FontAwesome bullets, rating stars), passes all file checks today.

## Gap

Rezi's public checker explicitly claims font-size and improper-font
checkpoints; we have none.

## Design (extends `src/lib/extractFile.ts` only — deterministic, local, zero score impact)

PDF (`extractPdf`):
1. **"Body text at least 9pt"** — per text item, font size ≈
   `hypot(transform[0], transform[1])` (text-space scale); weight by character
   count; fail when >25% of characters are below 9pt. Hint reports the share.
2. **"No icon-font glyphs"** — any extracted character in the Unicode Private
   Use Area (U+E000–U+F8FF): icon fonts (FontAwesome bullets, star ratings)
   render as unreadable boxes to ATS parsers. Extracted text is left unchanged
   (score neutrality preserved).

DOCX (`extractDocx`):
3. **"Body text at least 9pt"** — regex-scan runs (`<w:r>…</w:r>`): character
   count of each `<w:t>` weighted by the run's `<w:sz w:val>` (half-points;
   runs without `w:sz` are assumed fine); fail when >25% of characters are
   below 18 half-points (9pt).
4. **"No icon-font glyphs"** — PUA characters in extracted `<w:t>` text (e.g.
   Wingdings/Symbol bullets encoded in the PUA).

Checks appear in the existing "Uploaded file checks" list on /ats-checker,
already labeled "Not counted in the score".

## Acceptance criteria

- 7pt-body PDF/DOCX fails the size check; normal 10–11pt resumes pass.
- Small footnote text (<25% of chars) does not fail a normal resume.
- PDF/DOCX with PUA glyphs fails the icon check; clean files pass.
- Extracted text and ATS score identical before/after (score neutrality).
- Existing R189 checks unchanged; paste flow unaffected.
- Desktop/mobile/dark rendering of the checks list unchanged (same component).

## Non-goals

- No font *family* whitelisting (font naming in PDFs is unreliable; avoid
  false positives), no schema/AI changes, no score changes.
