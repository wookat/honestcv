# R276: render inline marks in the styled companyInfo line (PDF + DOCX)

## Evidence

- R275 closed inline-mark parity for all *plain* PDF body-text fields and the DOCX
  labelled skills line. The one remaining leak documented in
  `docs/plan-r275-pdf-body-marks.md` is the experience `companyInfo` line.
- Source inspection (verified 2026-09-02):
  - PDF (`src/lib/pdf.ts`): `w.text(e.companyInfo.trim(), { font: w.fonts.italic, size: 9, color: w.soft })`
    — raw string drawn verbatim, so `__x__`/`**x**` leak literally.
  - DOCX (`src/lib/docx.ts`): single `new TextRun({ text: e.companyInfo.trim(), italics: true, size: sz(19) })`
    — same literal leak.
  - Preview (`src/components/ResumePreview.tsx`): companyInfo renders through
    `InlineText` → `MarkedText`, so marks are already parsed on screen — the UI
    invites marks the exports then leak.
  - TXT strips every line via `stripInlineMarks` (R274-era single sink) — OK.
  - Markdown applies `marksToMarkdown` to every line (R274) — OK.

## Root cause

`richText()`/`drawRuns()` are hard-coded to the 10pt regular/ink body style.
companyInfo is 9pt italic in the soft color, so R275 deliberately left it out
pending a style-aware helper.

## Design

`src/lib/pdf.ts`:
- `wrapRuns(runs, fonts, size, maxWidth)` gains a base-font choice already via the
  `fonts` argument — pass `{ regular: italic, bold, italic }` so unmarked runs
  render italic while `**bold**` still maps to the bold face.
- `richText(text, size, opts?: { fonts?: Fonts; color?: RGB; gap?: number })`:
  optional style override for base fonts and ink color, and a configurable
  trailing gap (default 2, unchanged) so call sites that manage their own
  spacing (companyInfo) can pass `gap: 0`.
- `drawRuns` threads `fonts`/`color` through; underline rule and non-link run
  color use the override; link runs keep the accent color + URI annotation.
- companyInfo call site:
  `hasInlineMarks(t) ? w.richText(t, 9 * w.fs, { fonts: {…regular: italic}, color: w.soft, gap: 0 }) : old path`
  — mark-free output byte-identical.

`src/lib/docx.ts`:
- companyInfo paragraph maps `parseInlineMarks(text)` to runs with
  `italics: true` base (matching existing style), `bold: r.bold`,
  `underline: r.underline ? {} : undefined`, hyperlink style for `r.href` —
  same pattern as `body()`/labelled skills (R275).

Out of scope: heading/title lines, cover-letter/interview-brief PDFs, dates.

## Validation

- Extend `.tmp-smoke/r275_oracle.ts` → `r276_oracle.ts`: companyInfo with
  `**bold**`/`__underline__` extracts cleanly in pdftotext with zero literal
  marks; mark-free companyInfo PDF byte-comparable behavior; DOCX zero literal
  marks with real `w:u` run and italics preserved.
- lint / typecheck / build green; deploy; production QA via real UI downloads.
