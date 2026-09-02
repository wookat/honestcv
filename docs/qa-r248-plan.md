# R248 QA plan — "Import a cover letter" on Dashboard Career documents

Code evidence: src/pages/Dashboard.tsx:577–603 handleImportDocFile (extractTextFromFile → <30 trimmed chars error "No text found in this file — it may be a scanned image."; title = filename base with [-_]+→spaces, collapsed, fallback 'Imported cover letter'; saveCareerDoc('cover',…) → setDocs → open dialog docView='edit'); :936–957 button "Import a cover letter" (busy label "Reading your letter…") + hidden input accept=".pdf,.docx,.txt" aria-label "Import a cover letter file"; :959 error `<p class=text-destructive>`; :966–992 type filter chips with counts; src/lib/extractFile.ts:79 unsupported → "Unsupported file type — please upload a PDF, DOCX or TXT file."; doc dialog :1558–1621 (edit/preview toggle, PDF/DOCX docDownload with professionalFileName, delete). Bundles expected: index-ho-GVTle.js / Dashboard-CUBzI5tn.js.

Method: production via CDP (suppress_origin=True); file injection via CDP DOM.setFileInputFiles on the hidden input; fixtures written locally (txt, minimal docx zip, minimal pdf, png, tiny txt); fetch counter asserts zero /api/ai/*; screenshots (recording known down, attempted once).

## X0 Bundles
index-ho-GVTle.js + Dashboard-CUBzI5tn.js live on /dashboard (or actual dashboard route).

## X1 TXT import end-to-end (primary)
Fixture `jane-doe_cover-letter.txt` with known ≥30-char multi-line body. Click "Import a cover letter" path → set file on input[aria-label="Import a cover letter file"] → doc dialog opens with title "jane doe cover letter", edit view active (Edit aria-pressed=true), textarea value byte-identical (`===`) to the fixture text. Close dialog → doc listed at TOP of Career documents list labeled Cover letter; filter chips show "All (1)" and "Cover letters (1)"; clicking "Cover letters" chip shows the doc. Screenshots.

## X2 DOCX + PDF import
Minimal DOCX (zip with word/document.xml containing "Dear team, this is my imported DOCX cover letter for QA purposes.") → doc saved, dialog text contains that sentence; title from filename. Minimal text PDF fixture → same (if the hand-built PDF fails pdf.js parsing, mark PDF untested and say so).

## X3 Dialog preview + downloads (R239)
Open imported doc → Preview view renders letterhead LetterPreview; PDF and DOCX download buttons produce professional filenames (capture via HTMLAnchorElement.click patch), pattern `<name>-…cover-letter.pdf/.docx` consistent with R239 naming for kind 'cover'.

## X4 Errors — no doc saved
(a) `pic.png` → error text exactly "Unsupported file type — please upload a PDF, DOCX or TXT file." rendered below button row; (b) `tiny.txt` ("hi") → exactly "No text found in this file — it may be a scanned image."; in both cases honestcv.careerDocs count unchanged and chips counts unchanged; error clears on next successful import. Screenshot of each error.

## X5 Persistence + delete
Reload /dashboard → imported docs still listed (honestcv.careerDocs). Delete the TXT doc via its delete button + confirm → removed from list, chip count decrements.

## X6 Regression
Resume import drop zone still imports a txt resume (or at least opens/behaves: use a valid resume txt → draft/confirm flow appears); "New cover letter" button links to /builder?doc=cover; doc type filter chips work with mixed kinds (seed one interview doc via localStorage to check chip appears).

## X7 375px + dark
375×812: Career documents button row (4 buttons) wraps, innerWidth==scrollWidth==375. Dark mode via UI toggle: rendered-pixel contrast of the "Import a cover letter" button label and the error text (trigger png error) — report ratios (≥4.5 target). Screenshots + crops.

## X8 Zero AI + cleanup
Fetch counter [] on every page. Remove honestcv.careerDocs and any other QA keys; final localStorage exactly ["honestcv.clientId","honestcv.qa"]; light theme. Screenshots r248_*.png; results appended below.

---

## Results (executed against production, bundles index-ho-GVTle.js / Dashboard-CUBzI5tn.js)

- X0 PASS — index-ho-GVTle.js + Dashboard-CUBzI5tn.js live on /dashboard; "Import a cover letter" button present in the Career documents row; baseline localStorage ["honestcv.clientId","honestcv.qa"].
- X1 PASS — jane-doe_cover-letter.txt (314 chars) set on input[aria-label="Import a cover letter file"] via CDP DOM.setFileInputFiles → dialog opened, title "jane doe cover letter" (-/_ → spaces), Edit aria-pressed=true / Preview=false, textarea value byte-identical (===) to the fixture. After close: doc first in list as "Cover letter", chips "All (1)|Cover letters (1)", filter shows it; honestcv.careerDocs [{cover,"jane doe cover letter"}]. Screenshots r248_txt_dialog / r248_txt_listed.
- X2 PASS — minimal DOCX → title "imported docx letter", text contains the fixture sentence; minimal hand-built PDF → title "pdf cover letter", extracted text exactly the fixture sentence, no error. Screenshots r248_docx_dialog / r248_pdf_dialog.
- X3 PASS — Preview view renders LetterPreview (date + letter body, no textarea); downloads with no resume draft were "cover-letter.pdf/.docx" (fallback, no letterhead name); after seeding draft fullName "Jane Doe" → "jane-doe-cover-letter.pdf" / "jane-doe-cover-letter.docx" (R239 professional naming). Screenshot r248_preview.
- X4 PASS — pic.png → exactly "Unsupported file type — please upload a PDF, DOCX or TXT file."; tiny.txt (2 chars) → exactly "No text found in this file — it may be a scanned image."; careerDocs count unchanged (3→3) and chips unchanged through both errors; next successful import cleared the error and prepended the new doc. Screenshots r248_error_png / r248_error_tiny.
- X5 PASS — reload kept all 4 docs ("All (4)|Cover letters (4)"); Delete → confirm dialog 'Delete "jane doe cover letter"?' → counts 4→3, doc removed from honestcv.careerDocs. Screenshot r248_delete_confirm.
- X6 PASS (Regression) — seeded interview doc → chips "All (4)|Cover letters (3)|Interview prep (1)", Interview filter shows only it; "New cover letter" href /builder?doc=cover; resume drop-zone input still works: resume.txt → "Open the imported resume?" confirm dialog (draft existed), draft NOT replaced after Cancel/navigation (fullName stayed "Jane Doe"). Screenshot r248_resume_import_regression.
- X7 PASS — 375×812 dashboard innerWidth/scrollWidth 375/375 with the 4-button row wrapped; dark rendered-pixel contrast: "Import a cover letter" button 13.71:1, destructive error text 5.31:1 (2–98% percentile method). Screenshots r248_375_buttons / r248_dark_docs + crops. (First crop attempt measured ~1.1:1 because CDP clip coords are document-relative while getBoundingClientRect is viewport-relative on a scrolled page — automation bug, re-captured with scrollX/scrollY added.)
- X8 PASS — __aiReqs [] on every page load (zero /api/ai/*); light theme restored via UI toggle; removed honestcv.careerDocs / honestcv.resume / honestcv.theme; final localStorage exactly ["honestcv.clientId","honestcv.qa"]. Screenshot r248_cleanup_final.

Caveats: recording service still down (ffmpeg exits on start; attempted once); computer-use screen tooling unavailable — screenshots CDP-captured and validated programmatically (dimensions, luminance range, pixel-contrast crops) rather than eyeballed.
