# R278: render inline marks in entry headline lines (PDF + DOCX)

## Evidence

- Preview: every headline field (role, company, degree, school, project name,
  involvement, coursework, certifications, awards, volunteering, military,
  references, custom items) renders through `InlineText`/`MarkedText`, so
  `**`, `__` and `[](url)` are parsed and styled.
- TXT strips marks on every line (`resume.ts` final serialization) and MD
  rewrites underline on every line (R274) — both already clean.
- PDF: `titleLine()` draws the left column with `w.text(left, { font: bold })`
  / raw `drawText` — literal `**x**` prints in the title (verified by source
  inspection; same defect class as R272/R275/R276, last unhandled outlet).
- DOCX: entry headlines are single `new TextRun({ bold: true })` calls per
  field — literal marks leak the same way.

## Design

### PDF (`src/lib/pdf.ts`)

- `drawRuns()` gains `opts.maxWidth` (defaults to `contentW - indent`).
- `titleLine()`: when `hasInlineMarks(left)`,
  - fit decision uses `stripInlineMarks(left)` width in the bold font;
  - bold-base font set: `{ ...fonts, regular: fonts.bold }` so unmarked text
    stays bold, `*italic*` maps to the italic face, underline/links keep the
    existing run geometry;
  - stacked path (no dates / too wide): `richText(left, size, { fonts, gap: 0 })`
    then dates below unchanged;
  - two-column path: `drawRuns(left, …, { fonts, maxWidth: leftMax })` (single
    line by the fit check), then draw the right dates at the same `this.y`.
- Mark-free titles keep the existing byte-identical path.
- Out of scope: section headings (uppercase `heading()`), name header —
  no observed defect reports; candidate for a later round if QA flags them.

### DOCX (`src/lib/docx.ts`)

- New helper `headRuns(text, size)`: mark-free → the existing single bold
  `TextRun` (unchanged output); marked → `parseInlineMarks()` runs with
  `bold: true` base plus per-run italics/underline/hyperlink.
- Replace user-text headline `TextRun({ bold: true })` call sites with
  `...headRuns(field, N)` across experience/education/projects/involvement/
  coursework/certifications/awards/volunteering/military/references/custom.

## Validation

- Oracle: PDF role `**Senior** __Engineer__`, degree, project name extract
  clean (no literal marks) with dates still right-aligned on the same line;
  DOCX headline runs carry real bold+italics/underline; mark-free resume
  byte-behavior unchanged; R275–R277 oracles re-run green.
- lint / typecheck / build; deploy; production QA via real UI downloads.
