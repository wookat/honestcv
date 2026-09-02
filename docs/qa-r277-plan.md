# QA plan — R277 PDF rich-text run spacing (glued punctuation) — production cv.zalize.com

Bundle live at plan time: `index-Dmv7TG8u.js` (record pdf chunk hash from resources). Zero non-quota
AI; CDP screenshots (recording down since R166); restore baseline ["honestcv.clientId","honestcv.qa"]
+ system theme at end.

Code-traced (commit 0c01404, src/lib/pdf.ts): wrapRuns now marks a RunWord `glue:true` when its run
starts with no leading whitespace and the previous run ended without trailing whitespace; glued
clusters wrap as one unit; drawRuns:506 skips the inter-word space when `w.glue`. Old behavior drew
`rigor .` / `Python ,` (visible gap + pdftotext space before punctuation).

## G1 — Marked fixture PDF (primary)
Seed: summary `Led **growth** with __rigor__. Then (**fast**) wins, __daily__, at [Acme](https://acme.com).`,
skills `Languages: __Python__, **Go**`, experience bullet `Shipped __v2__; cut costs by **40%**.`
Download PDF via UI.
- pdftotext (layout-insensitive grep): contains `rigor.` `(fast)` `wins,` `daily,` `Acme.`
  `Python,` `v2;` `40%.` — i.e. NO space between styled word and adjacent punctuation (old build:
  `rigor .`, `Python ,` etc.); zero literal `**`/`__`/`[](…)`.
- Raster 150dpi + zoom crop: pixel gap between the underlined `rigor` glyphs and the following
  period ≤ normal intra-word gap (no visible word-space); underline rule ends at `rigor`'s last
  glyph, does NOT extend under the period; `(fast)` parens hug the bold word.
- pdffonts sanity (Times faces).

## G2 — Regression
- R276: companyInfo `Series **B** fintech, __200__ employees` (same resume) still clean — pdftotext
  `fintech,` glued? Note: `fintech,` was already one run so unchanged; key check is zero literals,
  underline under `200` only.
- Mark-free resume: PDF downloads, pdftotext lines intact, zero underline rules, no artifacts.
- DOCX/TXT/MD of marked fixture: quick sanity (download OK; MD has `<u>rigor</u>.` no `__`; TXT
  stripped; DOCX zero literal marks) — unchanged code paths.

## Discipline
Byte + pixel checks; `__aiReqs` [] throughout; ambiguous → inconclusive; screenshots r277_*.
Cleanup: baseline keys only, system theme.

## Findings (appended after run)
- G1 pdftotext: rigor. (fast) wins, daily, Acme. Python, v2; 40%. all glued (each grep=1); 0 literal marks — PASS
- G1 raster: underlines exactly rigor(356:261-301), daily(461-502), Acme link(534-582), 200(495), v2(528:215-235), Python(631); period after rigor at 303-305 with 2px gap (word spaces are ~7px) and NOT underlined; (fast) parens hug bold word (no 7px gap inside) — PASS
- G2: companyInfo clean w/ single underline under 200; mark-free PDF 0 artifacts/underlines; MD <u>rigor</u>. / TXT stripped / DOCX 0 literals, 5 w:u — PASS
- bundles index-Dmv7TG8u.js / pdf-BvUJtdDc.js / docx-C4t1N3Rj.js; ai [], errs [], baseline keys, system theme — PASS
