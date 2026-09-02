# QA plan — R272 PDF summary inline marks (production cv.zalize.com)

Bundle `index-BLYGSgYz.js` / `pdf-ClvNZ7NR.js` (confirm index in resource entries first).
Zero non-quota AI; CDP screenshots (recording down since R166); restore baseline
["honestcv.clientId","honestcv.qa"] + system theme at end. Desktop, light theme only (per lead).

Code-traced: pdf.ts:723–728 summary now `hasInlineMarks(s) ? w.richText(s) : w.text(s,{size:10})`;
richText :456–459 → drawRuns :461–508 (bold/italic/underline runs + Link/URI annots :491–500).
Old behavior (R271): literal `**bold**` asterisks in pdftotext of summary.

## M1 — Marked summary (primary)
Seed resume, summary: `Engineer with **bold** words, *italic* flair, __underline__ rule and a
[portfolio link](https://example.com/x) inline.` Bullet with `**critical**` for regression.
Download PDF via UI PDF button (+ Download anyway).
- pdftotext of summary: contains `bold words`, `italic flair`, `underline rule`, `portfolio link`;
  ZERO occurrences of `**`, `__`, `[portfolio` or `](` anywhere in output (old behavior fails this).
- Link annotation: `mutool clean -d` (or pdftotext -raw + grep) shows `/URI (https://example.com/x)`.
- Rasterize page 1 at ≥150dpi → visually confirm (screenshot): bold heavier weight, italic slant,
  underline rule below "underline rule" text. Pixel supplement: compare ink density bold vs regular
  word; detect horizontal dark run under underline word.
- Bullet regression: pdftotext bullet reads `critical` (no asterisks) — same as R271.

## M2 — Plain summary regression
Change summary to `Plain summary without any special formatting.` → PDF downloads; pdftotext contains
that exact sentence; no artifacts; no errors.

## M3 — CJK + marks regression (R271)
Summary `张伟是**资深QA工程师**，专注自动化测试。` with CJK name → PDF downloads (noto fonts fetched);
pdftotext contains `资深QA工程师` with no `**`; raster shows real CJK glyphs (bold run may map to
Noto bold; italic→regular is expected per lead — do not flag).

## Discipline
Every assertion pass/fail with evidence path; ambiguous → inconclusive. `__aiReqs` [] throughout.
Screenshots under /home/ubuntu/screenshots/r272_*.

## Findings (appended after run)
