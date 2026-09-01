# R215 QA plan — "Professional file name" uploaded-file check (index-Dv1s8eoP.js)

Code evidence: src/lib/extractFile.ts — fileNameCheck(file): base = name minus extension; tokens = lowercase split on [-_ .,()+]+; junk = any token in {untitled, document, doc, copy, final, draft, new, updated, latest, edit, edited, version} or /^v\d{1,2}$/ or /^\d{1,2}$/; pass iff (tokens include 'resume' or 'cv') && !junk. Fail hint: `Rename "<file.name>" to your full name plus "resume" (e.g. "Jane-Doe-Resume.pdf") — recruiters and portals see the file name first.` Appended to checks for TXT (after sizeCheck), PDF, DOCX. Display-only — no score impact.

## J1 Bundles
index-Dv1s8eoP.js / AtsChecker-CuGFSFkV.js / ats-ygkBT6lR.js exact.

## J2 Pass cases
(a) Upload "Jane-Doe-Resume.pdf" (copy of clean.pdf) → "Professional file name" passes. (b) "Jane Doe Resume 2026.txt" passes (4-digit year not junk). (c) "jane_doe_cv.docx" passes.

## J3 Fail cases
(a) "resume_final_v2 (3).pdf" → fails, hint quotes exact name + "Jane-Doe-Resume.pdf" suggestion (final, v2, 3 all junk). (b) "Untitled document.docx" → fails (untitled+document, no keyword). (c) "JaneDoe.pdf" → fails (no resume/cv token).

## J4 Score neutrality
Same content pasted vs uploaded (with junk name) → identical N/100 score; checker structure rows still 15.

## J5 Row counts
PDF upload → "Uploaded file checks" has 7 rows; DOCX → 7; TXT → 2 (size + file name).

## J6 375 + dark
Failing file-name row at 375 (scrollWidth==375); dark pixel contrast ≥4.5:1.

## J7 Regression
R207 font checks ("Body text at least 9pt", "No icon-font glyphs") pass on clean.pdf; R214 date check fails on numeric-date paste (quick).

## J8 Cleanup
Zero AI generation calls (quota read OK); light theme; localStorage exactly ["honestcv.clientId","honestcv.qa"].

## Results (production)
- J1 bundles exact: index-Dv1s8eoP.js / AtsChecker-CuGFSFkV.js / ats-ygkBT6lR.js — PASS
- J2a "Jane-Doe-Resume.pdf" → Professional file name passes — PASS
- J2b "Jane Doe Resume 2026.txt" → passes (4-digit year allowed) — PASS
- J2c "jane_doe_cv.docx" → passes — PASS
- J3a "resume_final_v2 (3).pdf" → fails, hint quotes exact name + "Jane-Doe-Resume.pdf" suggestion — PASS
- J3b "Untitled document.docx" → fails; J3c "JaneDoe.pdf" → fails (no resume/cv token) — PASS
- J4 score neutrality: junk-named txt upload 67/100 == identical pasted content 67/100; paste structure rows still 15 (no new scored row) — PASS
- J5 row counts: PDF 7 (size, file name, pages, columns, images, 9pt, glyphs) — PASS; TXT 2 (size, file name) — PASS; DOCX = 8, not 7 as stated in the task (size, file name, tables, text boxes, images, headers/footers, 9pt, glyphs) — new row present; the "7" in the task appears to be a miscount, no product bug
- J6 375px scrollWidth 375; dark label pixel contrast 14.75:1 — PASS
- J7 regression: R207 "Body text at least 9pt"/"No icon-font glyphs" pass on clean.pdf; R214 numeric-date paste fails quoting "08/2021" — PASS
- J8 zero AI generation calls (quota read only); light theme; localStorage exactly ["honestcv.clientId","honestcv.qa"] — DONE
