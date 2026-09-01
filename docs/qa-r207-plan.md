# R207 QA plan — font-size & icon-glyph file checks (index-R5UHuXPF.js)

Code evidence: src/lib/extractFile.ts — PDF: per text item size = hypot(transform[0],transform[1]), chars <9pt counted, fail iff share >25%, hint "NN% of the text is smaller than 9pt…"; icon check fails iff extracted text matches /[\uE000-\uF8FF]/. DOCX: per-run w:sz half-points (<18 → small), runs without w:sz assumed fine, weighted by w:t char count; icon check over concatenated run text. Both appended after "No embedded images" (PDF) / "No text in headers or footers" (DOCX). UI: /ats-checker upload via `input[type=file]` + click "Check my ATS score" (upload resets checked). Fixtures via reportlab (PDF) and hand-built zips (DOCX).

## A1 Bundle
Entry index-R5UHuXPF.js. PASS iff exact.

## A2 Clean PDF (10.5pt body, ~40+ words)
Upload → Check. PASS iff "Uploaded file checks" lists BOTH new labels with pass state: "Body text at least 9pt" ✓ and "No icon-font glyphs" ✓, after "No embedded images"; R189 checks (size/pages/columns/images) still listed.

## A3 7pt-majority PDF
Body mostly 7pt + small 11pt heading. PASS iff "Body text at least 9pt" FAILS and hint shows NN% ≈ expected share (>25%, computed from fixture char counts ±3%).

## A4 Footnote PDF (<25% small)
~80% chars at 10.5pt + one 7pt footnote line (<25% of chars). PASS iff size check passes despite small text present.

## A5 PUA glyph file
PDF containing U+E0A0 (TTF/ToUnicode route; if pdf.js extraction drops it, fall back and disclose) — else DOCX with \uE000 in w:t. PASS iff "No icon-font glyphs" FAILS with the unreadable-boxes hint; clean file passes (A2).

## A6 DOCX variants (hand-built zip: [Content_Types].xml + word/document.xml)
(a) majority runs w:sz 14 (7pt) → size check fails, NN% matches char weighting; (b) same text w:sz 22 → passes; (c) runs WITHOUT w:sz → assumed fine, passes; (d) run text with \uE000 → icon check fails. Existing DOCX checks (headers/footers etc.) still listed.

## A7 Score neutrality
Upload clean PDF → note ATS score & extracted text; paste the same text → Check → identical score. PUA DOCX: extracted textarea text still CONTAINS the PUA char (not stripped).

## A8 Layout/dark (quick)
Result card with new checks at 1440, 375 (scrollWidth==375) and dark mode — screenshot each, labels legible.

## A9 Regression
R189: 3-page PDF fails "3 pages or fewer"... (use existing multi-check: image PDF fails "No embedded images"); R206 smoke: Builder "Suggest a bullet" opens review dialog via mock (no quota). Zero /api/ai calls total.

## A10 Cleanup
localStorage exactly ["honestcv.clientId","honestcv.qa"]; light theme.

## Results (2025-09-01, production, index-R5UHuXPF.js)
- A1 PASS — entry https://cv.zalize.com/assets/index-R5UHuXPF.js.
- A2 PASS — clean.pdf (10.5pt): checks list = [File size under 2 MB, Two pages or fewer, Single-column layout, No embedded images, Body text at least 9pt ✓, No icon-font glyphs ✓].
- A3 PASS — small.pdf (7pt body, expected 95% small): size check FAILS with hint "95% of the text is smaller than 9pt — many ATS parsers and recruiters struggle with tiny type; use 10–12pt body text."
- A4 PASS — footnote.pdf (17% small chars): size check passes.
- A5 PASS — pua.pdf (DejaVu TTF, U+F000 glyph): "No icon-font glyphs" FAILS with unreadable-boxes hint; clean.pdf passes.
- A6 PASS — small.docx (w:sz 14 majority, expected 94%): fails "94% of the text is smaller than 9pt…"; clean.docx (sz 22) passes; nosz.docx (no w:sz) passes; pua.docx (\uE000×3 in run) icon check FAILS. DOCX list order confirmed: [size, tables, text boxes, images, headers/footers, Body text at least 9pt, No icon-font glyphs].
- A7 PASS — pua.docx upload score 50/100; extracted textarea contains U+E000 ×3 (not stripped); re-checking the same pasted text → 50/100 (identical).
- A8 PASS — 1440 ok; 375 scrollWidth 375; dark: label pixel contrast 14.75:1, fail-hint 5.85:1 (bg 18,22,29).
- A9 PASS — image.pdf: "No embedded images" fails while both new checks pass (regression intact); R206 smoke: mocked suggest-bullet opens "Suggested bullet" dialog with draft "Mock R206 smoke bullet.", cancelled. Zero real /api/ai calls (only intercept-fulfilled).
- A10 PASS — final localStorage exactly ["honestcv.clientId","honestcv.qa"]; light theme.
