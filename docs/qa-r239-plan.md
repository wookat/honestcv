# R239 QA plan — professional export filenames

Code evidence: src/lib/download.ts:4–16 professionalFileName (trim→lowercase→[^a-z0-9]+→'-'→strip edge '-', blanks dropped, join '-', fallback 'document'); all exports funnel through downloadBlob anchor click (download.ts:24–34, pdf.ts:848/872/923, docx.ts:585/617/708). Builder resume download Builder.tsx:1482–1524 (gate order: free email gate if no honestcv.shared → final-check dialog if issues → download, then share nudge dialog "Resume downloaded — good luck out there" first time). Letter exports docFileName Builder.tsx:8030–8035. Dashboard runDownload:357 + saved-doc:324–330. Bundles: index-BW9Qg2nT.js / Builder-DkVGn41V.js / Dashboard-CV5FUN2m.js / download-Bs3IoJtm.js.

Capture method: override `HTMLAnchorElement.prototype.click` to push `{download}` into window.__dl and skip real download; for the PDF spot check also stash the blob for byte inspection. Zero AI calls. honestcv.shared pre-set for filename tests; cleared only for the gating/share-nudge regression.

## M0 Bundles
All four hashes live (index/Builder/Dashboard/download chunks in performance resources after visiting Builder + Dashboard).

## M1 Builder resume export, name+role
Fixture: fullName "Jane Doe", targetRole "Product Manager" (example resume edited via UI inputs), honestcv.shared=1. Trigger all 4 formats from the download menu → captured filenames exactly jane-doe-product-manager-resume.pdf/.docx/.md/.txt. (Final-check dialog may appear — proceed via its "Download anyway" path; that's part of M6 regression evidence.) Screenshot of download menu + logged names.

## M2 Blank role / blank both
Clear targetRole → jane-doe-resume.pdf. Clear fullName too → resume.pdf (NOT resume-resume.pdf, NOT document.pdf since 'resume' part remains). One format (pdf) suffices per state.

## M3 Punctuation slug
targetRole "Sr. Product Manager / Growth" → jane-doe-sr-product-manager-growth-resume.pdf (collapsed hyphens, no leading/trailing '-').

## M4 Letter exports (BundleToolDialog)
Restore fullName "Jane Doe". Cover letter dialog: company "Stripe", Insert template (offline), PDF + DOCX → jane-doe-stripe-cover-letter.pdf/.docx; clear company → jane-doe-cover-letter.pdf. Resignation: insert template, PDF → jane-doe-resignation-letter.pdf. Interview prep: get result via offline path if available; export → jane-doe-interview-prep.pdf. Zero /api/ai calls.

## M5 Dashboard
Save resume to My resumes if needed; Dashboard resume PDF → jane-doe-product-manager-resume.pdf (role restored). Saved career doc (save cover letter from dialog) download → jane-doe-stripe? NO — dashboard saved-doc base is [draft fullName, base] (no company): jane-doe-cover-letter.pdf. Assert exactly that.

## M6 Regression: gating + share nudge + R238 + ATS
Clear honestcv.shared → click PDF → FreeDownloadDialog (email gate) appears, no download fired (window.__dl unchanged). Set shared, download with issues → "Final check before download" dialog → Download anyway → file named per M1 and share dialog "Resume downloaded — good luck out there" appears (after clearing shared again it re-arms; verify nudge on first post-gate download). R238: #cover-addressee still present in cover dialog. ATS visible score identical before/after export flows. 375×812: download menu usable, no overflow (screenshot). Dark mode: download menu legible (screenshot; core-pixel if contrast doubt).

## M7 PDF content spot check
Captured PDF blob (jane-doe-product-manager-resume.pdf) → bytes start "%PDF", pdftotext (or python) extraction contains "Jane Doe" + a known experience string from the example resume — content unchanged aside from filename.

## M8 Cleanup
Restore anchor-click override + viewport via reload; localStorage exactly ["honestcv.clientId","honestcv.qa"]; light theme. Screenshots r239_*.png; results appended below.

## Results (production, index-BW9Qg2nT.js / Builder-DkVGn41V.js / Dashboard-CV5FUN2m.js / download-Bs3IoJtm.js)
- M0 bundles: all four live — PASS
- M1 Builder 4-format export ("Jane Doe" + "Product Manager"): jane-doe-product-manager-resume.pdf/.docx/.txt/.md exactly — PASS
- M2 blank role → jane-doe-resume.pdf; blank both → resume.pdf (not resume-resume.pdf) — PASS
- M3 "Sr. Product Manager / Growth" → jane-doe-sr-product-manager-growth-resume.pdf — PASS
- M4 letters: cover+Stripe → jane-doe-stripe-cover-letter.pdf/.docx; blank company → jane-doe-cover-letter.pdf; resignation → jane-doe-resignation-letter.pdf; interview → jane-doe-interview-prep.pdf — PASS (zero AI calls; offline templates)
- M5 Dashboard: draft PDF/DOCX = jane-doe-product-manager-resume.*; saved cover doc → jane-doe-cover-letter.pdf ([fullName, base], no company — per spec) — PASS
- M6 regression: honestcv.shared cleared → PDF click → "Downloads are free during the beta" email gate, 0 downloads fired; email submit ("qa-r239@zalize.com") → "Final check before download" dialog → Download anyway → correctly named file + "Resume downloaded — good luck out there" share nudge, shared=1; R238 #cover-addressee present; ATS 99/100 identical before/after; 375×812 iw/sw 375/375; dark download row screenshot — PASS
- M7 PDF spot check: captured blob %PDF-1.7, pdftotext shows full example resume (Jane Doe, Brightlane bullets, education, skills) — content unchanged — PASS
- M8 cleanup: localStorage exactly ["honestcv.clientId","honestcv.qa"], light theme, overrides cleared by reload — DONE. Screenshots /home/ubuntu/screenshots/r239_*.png. Recording service unavailable.
Notes: capture method = HTMLAnchorElement.prototype.click override recording a.download (all exports funnel through downloadBlob); one QA email submitted to the free-download gate (subscribe endpoint) to exercise the gated path.
