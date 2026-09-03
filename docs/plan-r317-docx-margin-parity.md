# R317 — DOCX margins must match the labeled inches (parity with PDF)

## Evidence (first-party, R316 production audit)

- The Builder Margins stepper (R293) labels the three steps **0.5″ / 0.75″ / 1″** and
  `PAGE_MARGIN_PT = {narrow: 36, normal: 54, wide: 72}` (pt = 1/72″), so the labels are exact in points.
- PDF export honors the label exactly: `PdfWriter.setMargin(pageMarginOf(resume))` sets all four
  margins to 36/54/72pt — R293 and R316 both verified the leftmost glyph xMin at exactly 36.0pt
  for the 0.5″ setting on a real downloaded file.
- DOCX export does **not**: `docx.ts` scales its historical defaults proportionally
  (`marginScale = pageMarginOf/54`, sides `864 × scale`, top/bottom `720 × scale`), producing
  576 / 864 / 1152 twips = **0.4″ / 0.6″ / 0.8″** sides. A user who picks "0.5 inch" gets a
  0.4-inch DOCX margin; the default "0.75 inch" DOCX has always really been 0.6″.
- R316 flagged this as an informational finding; this round converts it into the fix.

## Design

Map the DOCX section margins directly from the same point values the PDF uses
(20 twips per point), all four sides — mirroring `PdfWriter.setMargin`'s uniform margin:

```ts
const marginTwips = pageMarginOf(resume) * 20 // 36→720, 54→1080, 72→1440
const sideMargin = marginTwips
const vertMargin = marginTwips
```

`rightTab = pageSize.width - sideMargin * 2` continues to derive from `sideMargin`, so tab
stops, ruled widths and band shading follow automatically.

### Why changing the default DOCX bytes is correct here

The default (0.75″) DOCX export changes layout: sides 864→1080, top/bottom 720→1080 twips.
This is intentional — the current default is *mislabeled* (0.6″ shown as 0.75″), and honesty of
the labeled setting outweighs byte-stability of an incorrect layout. PDF/preview/TXT/MD are
untouched; no schema, worker, or serialization changes.

## Verification

- Local: `npx tsc -b`, `npx eslint src/lib/docx.ts`, `npm run build`.
- Production QA (real downloads, unzip `word/document.xml`):
  - `w:pgMar` left/right/top/bottom = 720 / 1080 / 1440 twips for the three stepper values.
  - PDF regression: leftmost xMin still exactly 36/54/72pt (unchanged code path).
  - Content intact (headings, bold/underline runs), rightTab-aligned dates still inside the page.
  - 375px strict width and dark mode regressions on /builder.
