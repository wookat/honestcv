# QA — R291 production (cv.zalize.com, expected index-ClLLZMYm.js / Builder-D0ZWkuSb.js)

Fixes the two R290 P2s. Code refs (local uncommitted diff on devin/1788368720-r290-audit-fixes):
pdf.ts ~769–784 (hasInlineMarks(c.title) → richText with accent + manual center-shift when
centerHeader), docx.ts ~205–222 (parseInlineMarks → styled TextRuns/ExternalHyperlink),
Builder.tsx 1754–1836 (PDF/DOCX/TXT/MD buttons `hidden 2xl:inline-flex`; compact dropdown div
`relative 2xl:hidden` — trigger `title="Download your resume"` aria-haspopup, menu buttons
"PDF/DOCX/TXT/MD" with Download icon). Tailwind 2xl = 1536px.

Method: CDP as prior rounds (port 29229, r283_lib), Fetch interception armed on *api/ai/* all
session (zero quota; no AI clicks expected), `honestcv.subscribed`+`shared`='1' to skip email
gate, "Download anyway" on final-check dialog, downloads to /home/ubuntu/qa/r291_dl.

Fixture: contact title `Senior **Platform** Engineer, __Cloud__ [team](https://example.com)`
(bold + underline + link in one string), name 王小明 QA, minimal experience.

## A. Title marks in exports
A1 PDF: pdftotext output contains "Senior Platform Engineer, Cloud team" and NO literal
`**`/`__`/`](http`. Pixel check: pdftoppm render — "Platform" drawn in bold face (pdfminer
fontname per char: Platform chars use Bold font, neighbors regular); title line uses accent
color (non-black ink present on that line). Link: PDF has a URI annot to https://example.com.
A2 DOCX: word/document.xml title paragraph has `<w:b/>` run "Platform", `<w:u` run "Cloud",
hyperlink rel to example.com around run "team"; no literal marks in w:t text.
A3 Regression mark-free title: set plain "Senior Platform Engineer" → PDF byte path unchanged
(pdftotext exact text, no ** anywhere), DOCX single run.
A4 Centered template (Modern / centerHeader): with the MARKED title, rendered title line is
visually centered — pdfminer x-extents of the title line midpoint within ±10pt of page center
(306pt letter); with plain title also centered (regression).
A5 TXT/MD regression: TXT strips to plain "Senior Platform Engineer, Cloud team"; MD keeps
marks verbatim in heading.

## B. Header layout
B1 At 1280/1366/1440/1512: scrollWidth <= innerWidth on /builder; the four full-format
buttons are display:none; dropdown trigger visible. Open dropdown → 4 items PDF/DOCX/TXT/MD;
download each format once from the dropdown at 1280 → 4 files land.
B2 At 1536 and 1600: four full buttons visible (inline-flex), dropdown hidden, no overflow.
B3 375px regression: scrollWidth==375, dropdown present (2xl:hidden covers mobile).

## Cleanup
localStorage back to [clientId, qa] (remove resume, resumeHistory, subscribed, shared);
empty html class; zero /api/ai requests all session. Screenshots r291_*.png.

## Results (executed — bundles verified index-ClLLZMYm.js / Builder-D0ZWkuSb.js)
All assertions PASSED. Zero /api/ai requests all session; baseline restored exactly
(["honestcv.clientId","honestcv.qa"], empty html class; also removed
honestcv.templateRecents created by template switching).

A1 PASS — pdftotext: "Senior Platform Engineer, Cloud team", zero literal `**`/`__`/`](http`.
pdfminer per-char fonts: "Platform" chars NotoSansSC-Bold, neighbors Regular. Link: pypdf
shows /URI annot https://example.com with Rect x386–415 matching the "team" glyph extent.
Underline: rendered PDF has a continuous dark row spanning exactly the "Cloud" x-extent
(350.5–383.5pt) at y=688.5pt.
A2 PASS — document.xml title paragraph: <w:b/> run "Platform", <w:u> run "Cloud", hyperlink
rel to example.com around run "team"; no literal marks in any w:t.
A3 PASS — plain title: PDF text exact, no marks; DOCX title paragraph is a single run with
no <w:b/>/<w:u> (plain_modern.docx).
A4 PASS — Modern template (accent #0f766e): marked title line all chars ink
(0.0588,0.4627,0.4314)=#0f766e, mid 307.8pt; plain title mid 306.0pt (page mid 306, ±10pt).
Default template marked title mid 307.8pt too.
A5 PASS — TXT: "王小明 QA — Senior Platform Engineer, Cloud team" (stripped); MD heading keeps
`**Platform**`, `<u>Cloud</u>`, `[team](https://example.com)`.
B1 PASS — scrollWidth/innerWidth: 1265/1280, 1351/1366, 1425/1440, 1497/1512 (no overflow;
R290 had 1377@1280). Full buttons display:none at all four; dropdown trigger visible; menu =
exactly [PDF, DOCX, TXT, MD]; all four formats downloaded successfully from the dropdown @1280.
B2 PASS — 1536 & 1600: four full buttons checkVisibility()=true (flex), dropdown wrapper
display:none, scrollWidth 1521/1585 (< innerWidth).
B3 PASS — 375: scrollWidth==375, dropdown trigger visible.

Artifacts: /home/ubuntu/qa/r291_dl/{王小明-qa-resume.{pdf,txt,md},marked_default.docx,
marked_modern.pdf,plain_modern.pdf,plain_modern.docx}; screenshots
/home/ubuntu/screenshots/r291_*.png. Findings: none (no P0–P3).
