# R272: PDF summary renders inline marks instead of literal asterisks

## Production evidence (R271 QA, PR #489 comment)

- P3: the Builder supports inline marks (`**bold**`, `*italic*`, `__underline__`,
  links) in text, and preview/TXT/DOCX/PDF-bullets all parse them — but the PDF
  summary section goes through plain `w.text(resume.summary.trim())`
  (src/lib/pdf.ts ~713), so a summary written with marks exports with literal
  `**` asterisks in the PDF. Confirmed via pdftotext on both the CJK and Latin
  QA downloads.

## Verified facts

- `PdfWriter.bullet()` already contains a complete rich-run renderer:
  `parseInlineMarks` → `wrapRuns` → per-word draw with bold/italic font pick,
  underline rule, and link annotations. The summary path never reaches it.
- DOCX (`summaryParagraph` via runs), TXT/Markdown (strip/preserve marks) and
  the live preview all handle summary marks; PDF is the only literal outlier.

## Design

- Extract the rich-run drawing loop from `bullet()` into a private
  `drawRuns(text, size, indent, marker)` helper on `PdfWriter`.
- `bullet()` keeps byte-identical output: same indent (14 + bi), same accent
  marker on the first line.
- New `richText(text, size)` uses indent 0 and no marker for paragraph text.
- Call site: summary uses `hasInlineMarks(resume.summary)` to pick
  `w.richText(...)` vs the existing plain `w.text(...)` — plain summaries keep
  the exact old byte path.
- Letter/interview PDFs (`downloadTextPdf`) are out of scope: their sources
  never carry marks.

## Validation

- tsx oracle: summary with `**bold**`/`*italic*`/`__underline__`/link marks →
  pdftotext output contains the clean words and zero `*`/`__`/`[` artifacts;
  plain summary byte-path regression (same bytes as before the change);
  bullet marks regression.
- Rasterize the marked-summary PDF (pdftoppm) and visually confirm bold/italic
  glyphs and underline rule.
- `npx tsc -b`, `npm run lint`, `npm run build`; deploy; production QA.
