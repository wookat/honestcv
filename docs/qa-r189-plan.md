# R189 QA plan — file-level ATS format checks on /ats-checker (index-BxEvaX3w.js / AtsChecker-BEObBwcX.js)

Code evidence: src/lib/extractFile.ts (sizeCheck ≤2MB; PDF checks "Two pages or fewer"/"Single-column layout"/"No embedded images"; DOCX checks "No tables"/"No text boxes"/"No embedded images"/"No text in headers or footers" via regex on word/document.xml + header/footer files); AtsChecker.tsx:449+ renders `Uploaded file checks (filename)` block with per-check BadgeCheck (emerald-600) / CircleAlert (text-destructive) + hint only on fail, "Not counted in the score" note; fileChecks set only in onFile → paste path never sets it. Upload via `input[type=file]` (fileRef) → CDP DOM.setFileInputFiles.

## Fixtures (local, python)
- dirty.docx: zip with word/document.xml containing `<w:tbl>`, `<w:txbxContent>`, `<w:drawing>`, real text in w:t; word/header1.xml with `<w:t>Header contact</w:t>`; [Content_Types].xml. Expect FAIL on all 4 DOCX checks, size pass.
- clean.docx: exported from Builder (R177 flow) or hand-built with plain paragraphs only. Expect all 5 checks pass.
- long.pdf: 3-page PDF (reportlab or pdftk from builder export). Expect "Two pages or fewer" FAIL with "This PDF has 3 pages", others pass.
- clean.pdf: Builder-exported 1-page resume PDF. Expect all 4 PDF checks pass (single column, no images... note builder PDFs shouldn't embed images).
- big.txt: >2MB text file. Expect "File size under 2 MB" FAIL with "This file is 2.x MB".

## F1 Bundles
Entry index-BxEvaX3w.js; /ats-checker lazy chunk AtsChecker-BEObBwcX.js.

## F2 Dirty DOCX (1440)
Upload dirty.docx → run "Check my ATS score". Pass iff section header "Uploaded file checks (dirty.docx)" appears in the result card; "No tables"/"No text boxes"/"No embedded images"/"No text in headers or footers" each show CircleAlert (destructive) + their exact hints; "File size under 2 MB" shows emerald BadgeCheck; screenshot.

## F3 Clean DOCX + score neutrality (adversarial)
Upload clean.docx → all 5 checks emerald. Score neutrality: record ATS score; then paste the extracted text directly (Paste-only flow) with same JD → identical keyword/structure scores AND no "Uploaded file checks" section in paste mode. Fail if scores differ or the section appears without an upload.

## F4 PDFs
long.pdf → "Two pages or fewer" fails with "This PDF has 3 pages —…", size/single-column/no-images pass. clean.pdf → all 4 pass.

## F5 Size check
big.txt (>2MB) → "File size under 2 MB" fails with MB figure; txt shows only the size check (1 item).

## F6 Error path unchanged
Empty/scanned-like PDF (no text layer) → error "No text found in this file — it may be a scanned image. Paste the text instead."; drag-drop path: dispatch drop event with DataTransfer file on the dropzone → same checks appear (verifies ondrop wiring).

## F7 Dark + 375
honestcv.theme=dark: new list legible (emerald/destructive icons on dark card); 375px: no horizontal overflow (scrollWidth === visualViewport.width) with the checks section rendered.

## F8 Regression smoke
Builder import (Upload on /builder) still imports the clean DOCX (fields populated); R188 jobs tailoring chip appears after saving a job.

## F9 Cleanup
Baseline exactly ["honestcv.clientId","honestcv.qa"]; remove fixture files /tmp/r189/*. Zero AI calls.
