# QA plan — R271 Unicode PDF export + visible export errors + Unicode filenames (production)

Target: https://cv.zalize.com, bundle `index-CXh0T0Le.js` (confirm in resource entries first).
Zero non-quota AI; CDP screenshots (recording down since R166); restore localStorage baseline
["honestcv.clientId","honestcv.qa"] at end.

Code-traced: pdf.ts:536–597 (UNICODE_FONT_FILES /fonts/notosanssc-{regular,bold}.ttf, lazy fetch,
assertFontCoverage throws "PDF export does not support some characters in this document yet: … DOCX,
TXT and Markdown exports support all characters."); Builder.tsx:812/1750–1762 dlError role=alert bar
with Dismiss; Dashboard.tsx:652–664 same bar, :338–341 career-doc PDF via downloadTextPdf/
downloadLetterPdf; professionalFileName slug now keeps \p{L}\p{N}.

## U1 — CJK resume PDF (the R270b F1 fix)
Seed resume: name `张伟 "Wei" O'Brien`, summary `资深QA工程师，专注自动化测试。`, Latin experience.
- PDF button (+ Download anyway) → a .pdf file downloads. FAIL if no file within 20s (R270b behavior).
- Filename retains CJK: starts with `张伟` (e.g. `张伟-…-resume.pdf`) per new \p{L} slug.
- Network resource entries include `/fonts/notosanssc-regular.ttf` (fallback fetched).
- pdftotext output contains `张伟` and `资深QA工程师` and Latin text intact (`Acme`, dates).
- Rasterize page 1 (pdftoppm) → screenshot: CJK glyphs visible, no tofu boxes; verify visually.
- Regression: DOCX/TXT/MD of same resume still download with CJK intact.

## U2 — Latin-only regression: no font fetch
Fresh page, seed ASCII-only resume ("Alex Rivera") → PDF downloads;
`performance.getEntriesByType('resource')` contains NO `notosanssc` entry. FAIL if fetched.

## U3 — Unsupported script → visible red alert (Builder)
Set name to `مرحبا Alex` → click PDF (+ anyway).
- No .pdf file downloads.
- Inline `role="alert"` bar appears containing byte-substring `PDF export does not support some
  characters in this document yet` and `DOCX, TXT and Markdown exports support all characters.`
- Screenshot desktop light + dark, and 375×812 (bar visible in viewport, scrollWidth 375);
  rendered-pixel contrast of bar text ≥ 4.5:1 in both themes.
- Click `Dismiss` → bar disappears.

## U4 — Dashboard career-doc download path
Seed honestcv.careerDocs: (a) cover letter with CJK text 张伟经历, (b) cover letter with Arabic مرحبا.
On /dashboard: (a) Download PDF → file downloads, pdftotext contains CJK; (b) Download PDF → same
role=alert bar with the unsupported-characters message on Dashboard, Dismiss works, no file.

## Discipline
Every assertion pass/fail with evidence path; ambiguous → inconclusive. `__aiReqs` [] throughout.
Cleanup: baseline keys only, system theme.

## Findings (appended after run)
