# R277: no spurious space around styled runs in PDF rich text

## Evidence

- R275/R276 production QA pdftotext extractions consistently show a space
  between a styled word and its trailing punctuation: `rigor .`, `Python ,`,
  `200 employees` is fine but `__200__,` would render `200 ,`.
- Source inspection (`src/lib/pdf.ts`): `wrapRuns()` splits every run's text on
  `/\s+/` into words and `drawRuns()` inserts a space width before every word
  with index > 0. Adjacent runs with no whitespace between them (e.g. runs
  `underline("rigor")` + `"."` from `…__rigor__.`) therefore get a drawn space
  that does not exist in the source text. This is a real rendered gap (space
  advance before the period), not only an extraction artifact.
- DOCX/preview/MD/TXT are unaffected (they keep run text verbatim).

## Design (`src/lib/pdf.ts` only)

- `RunWord` gains `glue: boolean` — true when the word continues the previous
  word with no whitespace between them in the source runs.
- `wrapRuns()`:
  - track `pendingGlue` across runs: a run whose text does not start with
    whitespace glues its first word to the previous run's last word when that
    run did not end with whitespace;
  - group words into clusters (a non-glued word plus its glued followers) and
    wrap greedily by cluster width so `rigor.` never breaks mid-cluster;
  - line width accounting: glued words add `wordW` only, others add
    `spaceW + wordW`.
- `drawRuns()`: `spaceW = j > 0 && !w.glue ? space : 0`; underline/link
  `joinPrev` join logic unchanged (a zero `spaceW` naturally closes the gap).
- No call-site changes; mark-free paths untouched (they never enter wrapRuns).

## Validation

- Oracle: PDF from `…__rigor__. Next` extracts `rigor.` with no space before
  the period; `__Python__, **Go**` extracts `Python,`; wrapped-line and
  link-run regressions; mark-free output unchanged.
- Pixel check in production QA: no visible gap before punctuation after an
  underlined word; underline still spans exactly the marked word.
- lint / typecheck / build green; deploy; production QA via real UI downloads.
