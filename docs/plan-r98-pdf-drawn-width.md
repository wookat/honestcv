# R98 — Measure PDF text as drawn (kerning-free) so wrapped lines stay inside the margin

## First-hand evidence

R97 production QA measured a wrapped PDF line ending at x=562.99 while the
content edge (pageW − 2·MARGIN, letter) is 558: pdf-lib's
`widthOfTextAtSize` returned 462.72 for text whose rendered glyph advances
sum to 467.97. Reproduced locally against the repo's own pdf-lib:

```
Helvetica  whole-string 271.69  per-char sum 284.54  (12.85pt under-measure)
Helvetica  whole-string 267.65  per-char sum 271.20  ( 3.55pt under-measure)
Merriweather (fontkit-embedded, subset)  304.30 vs 303.99  (≈0)
```

Root cause: for standard fonts `widthOfTextAtSize` applies AFM kern pairs,
but `drawText` emits a plain `Tj` with un-kerned advances — the drawn line
is wider than the measured one, so `wrapText` can pack a word too many and
overshoot the right margin (worst measured here ~13pt on kern-heavy text).
Embedded fontkit fonts measure whole-string essentially exactly.

## Fix

`drawnWidth(font, text, size) = max(Σ per-char widthOfTextAtSize, whole-string
widthOfTextAtSize)` — the per-char sum equals the drawn advances for standard
fonts (no kern pairs on single chars) and the whole-string value is exact for
embedded fonts, so the max is the true drawn width for both. Used everywhere
pdf.ts makes a width decision: `wrapText`, centered-line x, `labelledLine`
prefix offset, `titleLine` collision check, `linkLine` segment layout and
separator advance. No visual change for lines that already fit; over-full
lines now wrap one word earlier instead of crossing the margin.

## Non-goals

- Emitting kerned `TJ` arrays (changes rendered spacing of every PDF).
- Touching preview/DOCX (browser and Word do their own shaping).

## Verification

Local lint/tsc/build. Production QA: kern-heavy long line that previously
overshot now wraps within 558pt (pdfminer x-coordinates); Merriweather PDF
unchanged layout; titleLine/linkLine regressions; page-count advisory sane.
