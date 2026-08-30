# R31 — Letterhead exports for cover & resignation letters

Date: 2026-08-29 · Round: R31 · Status: planned

## First-hand evidence

Rezi (app.rezi.ai, audited 2026-08-29, shots in audit archive `shots-r31/`):

- The resume editor has a dedicated **AI COVER LETTER** section (`r31-coverletter`):
  cover letters are per-resume documents managed inside the editor, listed as
  entries ("Software Engineer / Brightlane") and rendered as real documents with
  the sender's name and contact details at the top (visible in the entry preview:
  "Alex Carter / rezaudit44790@… / (555) 210-4432"). Full letter editing is
  Pro-gated on our audit account, so the styled render beyond the header preview
  was not observed first-hand — noted as a limit, not extrapolated.
- The dashboard sidebar separates **COVER LETTERS** and **RESIGNATION LETTERS**
  as first-class document types (`r31-dashboard`, R23 already covers filtering).

RezUp production (cv.zalize.com, code + production behavior):

- Cover/resignation letters download through generic `downloadTextPdf` /
  `downloadTextDocx` (`src/lib/pdf.ts`, `src/lib/docx.ts`): hardcoded `modern`
  template, hardcoded Helvetica, hardcoded Letter size, and a literal
  **"Cover Letter"** bold title above the body. No sender name, no contact
  details, no date — a real cover/resignation letter needs all three, and a
  document that titles itself "Cover Letter" reads as a demo artifact.
- The resume exports (PDF/DOCX) already carry a full letterhead-quality header:
  name, contact link line, template accent, Auto/Serif/Sans font, Letter/A4.

## Gap (P1, feature depth + UI quality)

Letters are sent as standalone documents; ours are unusable as-is without the
user rebuilding the header in Word. The resume and its letters should read as
one matching application package (same font family, accent, page size, header
identity) — this is exactly the depth competitor letters have.

## Batch scope

1. `src/lib/pdf.ts` — new `downloadLetterPdf(resume, body, filename)`:
   - Resolves the resume's template/accent, `serifOf` font choice and
     Letter/A4 page size (same as the resume export).
   - Header: sender name (bold), contact line (email / phone / location /
     website — clickable like the resume export), accent divider line.
   - Date line (e.g. "August 29, 2026"), then body paragraphs
     (blank-line-separated, wrapped, multi-page safe). No self-title.
2. `src/lib/docx.ts` — new `downloadLetterDocx(resume, body, filename)` with the
   same structure (name, contact line with hyperlinks, accent bottom border,
   date, body paragraphs) in the resume's font and page size.
3. `src/pages/Builder.tsx` — cover letter and resignation letter PDF/DOCX
   buttons switch to the letter exports; the interview prep brief keeps the
   generic text export (it is private notes, not a sent letter).

Not in scope (deliberate): per-resume cover-letter entries inside the editor
nav (our dialog + saved career docs already cover the workflow); a rendered
letter preview pane (body textarea remains the editor); copying Rezi's
Pro-gating.

## Acceptance / QA

- Cover letter PDF: sender name + contact + today's date + body, in the
  resume's font (serif template → Times / sans → Helvetica), accent divider,
  Letter/A4 follows resume setting; no "Cover Letter" title text.
- Resignation letter PDF/DOCX: same letterhead.
- DOCX opens with same structure; hyperlinks work; body paragraphs preserved.
- Interview prep brief still exports with its title (unchanged regression).
- Long letter wraps to page 2 without header repetition errors.
- 375px: dialog buttons unchanged (≥40px, no overflow) — regression only.
- Empty contact fields degrade gracefully (segments omitted, no stray
  separators).
