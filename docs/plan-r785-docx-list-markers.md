# R785 — DOCX import hands the scorer and parser the list markers Word stores (`<w:numPr>`)

## Evidence (first-hand, before any source edit)

Harness `qa/r785-docx-bullets.mts` (same resume → `downloadResumeDocx` and `buildResumePdf` → the production
`extractResumeFile` / `pdfPageText` paths → `scoreResumeText` / `parseResumeText`), Northstar + sample × 3 templates:

| | bullet-marked lines in extracted text | `/ats-checker` checks run | score |
|---|---|---|---|
| PDF | 6 | 22 | Northstar 91 / sample 95 |
| DOCX | **0** | **16** | Northstar 94 / sample 94 |

The six checks that never run on a DOCX upload are exactly the bullet-quality family (`Bullet points per entry`,
`Active voice in bullet points`, `Strong bullet openers`, `Quantified bullet points`, `Punctuated bullet points`,
`Bullet points the right length`): `textBulletLines()` in `src/lib/ats.ts` keys on `BULLET_LINE_RE`
(`- – — • * ▪ ◦ ·` at line start), and the DOCX text has no marker on any bullet. The higher DOCX score is not
"better resume" — it is six fewer checks that could fail (production R784 QA: DOCX 94 vs PDF 95, same content).

Why: `extractDocx()` in `src/lib/extractFile.ts` derives text by `</w:p>` → newline and stripping every tag. Word
stores a bulleted/numbered paragraph as `<w:pPr><w:numPr><w:ilvl/><w:numId/></w:numPr></w:pPr>` — the glyph lives in
`word/numbering.xml`, never in the paragraph text. Every DOCX on the VM encodes bullets this way and none carries a
literal glyph:

| file | `<w:numPr>` | paragraphs | literal bullet glyphs |
|---|---|---|---|
| Oxford Careers `ox-traditional.docx` (real, R768) | 25 | 54 | 0 |
| Word `word-table` / `word-longtitle` / `word-plain` (R746) | 6 / 6 / 6 | 18 / 19 / 19 | 0 |
| our own `sample.docx` export (R784 download) | 6 | 18 | 0 |
| Alex Morgan export (R723) | 6 | 21 | 0 |

Import side (`parseResumeText`) currently survives on heuristics — Oxford parses 7 / 2 with bullets attributed by
line shape (>60 chars, verbs), so the parser gain is robustness (short bullets, capitalised headers) rather than a
measured defect; the measured defect is the scorer.

## Design

`extractDocx()` text derivation: for every `<w:p …>…</w:p>` whose `<w:pPr>` carries `<w:numPr>` with a
`<w:numId w:val="N"/>` where N ≠ 0 (Word writes `numId 0` for "numbering removed"), emit `• ` at the start of the
paragraph text. Everything else unchanged (tabs / breaks / entity decoding / whitespace fold). The `•` is the same
glyph our PDF renderer prints and pdf.js hands back, so both upload paths feed the scorer and parser the same shape.

Not done: reading `numbering.xml` to distinguish `1.` from `•` (the scorer and parser treat both as list items; a CV's
numbered list is a list); paragraphs that inherit numbering from a style (`ListParagraph` with `numPr` in
`styles.xml`) — none of the files on the VM does this; boundary recorded. Nested `<w:p>` inside text boxes — text
boxes are already flagged and rare.

## Validation plan

- `qa/r785-docx-replay.mts` before/after on 56 DOCX (6 real / third-party + 50 own template exports): extracted
  text (expect only `• ` prefixes), parsed JSON (expect identical or explainable), ATS check list (expect the six
  bullet checks to appear for every file with list paragraphs).
- 186-file text/PDF replay must be byte-identical (extractor change is DOCX-only; parser untouched).
- Tests: `tests/import/rules.test.ts` cannot exercise `extractDocx` (needs a File + fflate) — add
  `tests/docx.test.ts` that renders `sampleResume()` with `downloadResumeDocx`, runs `extractResumeFile`, and asserts
  six `• ` lines, the six bullet checks present in `scoreResumeText`, and a field-equal re-import; plus a
  `numId 0` paragraph is not marked.
- Local gates, deploy, production QA (DOCX upload → `/ats-checker` shows 22 checks; builder import unchanged).

## Result (after the edit, before deploy)

- `src/lib/extractFile.ts`: one `.replace` ahead of the tag strip — a `<w:pPr>` that contains `<w:numPr>` with
  `<w:numId w:val="N"/>`, N ≠ 0, gets `<w:t>• </w:t>` appended (stripped to `• ` a step later; the XML is never
  re-serialised). `src/lib/docx.ts`: `buildResumeDocx(resume): Promise<Blob>` split out of `downloadResumeDocx`
  (same split as `buildResumePdf`) so tests can render without a DOM.
- Replay `qa/r785-docx-replay.mts`, 56 DOCX, `/home/ubuntu/qa/r785-base` vs `r785-new`:
  - extracted text: 56 / 56 differ only by `• ` prefixes (`sed 's/^• //'` restores the base byte-for-byte);
    marked lines: 25 own template exports × 6, Alex 6, Word ×3 6, Oxford 25, Sumit 23.
  - parsed JSON: 55 / 56 identical. Sumit (our own R778 DOCX export of the real Pages CV) changes in the R778
    direction: `Recognition: Kudos Award for Excellent Performance (Feb 2019)` was opened as a company-less
    experience row with `Feb 2019` dates and is now the bullet it is; the four projects' bullet lines are `\n`
    separated instead of space-joined (the PDF path already read them so).
  - ATS: 56 / 56 gain the six bullet checks. sample 94 → 95 = PDF 95. Oxford 88 → 82 = its PDF export
    (`r771-ox.pdf`) 82 with the same four failing checks (`3–6 bullet points per role`, `Punctuated bullet points`,
    `LinkedIn URL`, `Locations on each entry`).
- `tests/docx.test.ts` (new): sample export → six `• ` lines equal to the source bullets, six bullet checks present,
  DOCX re-import field-equal to TXT re-import; hand-built `document.xml` with `numId` 1 / 12 / 0 and plain
  paragraphs (only 1 / 12 marked); a `<w:pPr>` without `numPr` right after a list paragraph is not marked.
  `npm test` 139.
- Text / PDF goldens (`tests/import/corpus.test.ts`, 106 files) unchanged — the edit is DOCX-only.
- Gates: tsc app + worker + test, eslint, build, verify-dist green.
