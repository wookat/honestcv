# RezUp Round 3 (PR #8, version 4c106ab1) — Live Test Plan

Live at cv.zalize.com; hard refresh first (stale-bundle pitfall). NO AI buttons. Recorded run.
Code evidence: src/lib/templates.ts (8 TEMPLATES; minimal/bold/elegant/engineer have headerAlign:'left'; bold nameCase:'upper', accent #1d4ed8, divider 'thick'), ResumePreview.tsx L39-44 (text-left + toUpperCase), pdf.ts/docx.ts honor same flags, AtsChecker.tsx L111-131 (Keyword match X/100 when keywordScore!==null, Structure Y/100 always, hint when no JD), scripts/build-seo.mjs (+4 /templates pages).

## 1. Templates 4 → 8 (desktop)
- /builder with sample resume. Pass: template row shows 8 buttons: Classic, Modern, Compact, Executive, Minimal, Bold, Elegant, Engineer.
- Click each new template and assert from screenshot pixels:
  - Minimal: name/title/contact LEFT-aligned, name normal case, no divider lines under headings.
  - Bold: name UPPERCASE at left margin, thick blue (#1d4ed8) rules under headings.
  - Elegant: left-aligned serif header, purple accent, Title-case headings.
  - Engineer: left-aligned sans header, green accent, thin rules.
- Regression: click Classic → header CENTERED, normal-case name (unchanged old behavior).
- Fail: any new template stays centered, Bold name not uppercase, or old template becomes left-aligned.

## 2. Left-aligned header carries into downloads (Bold)
- With Bold selected, download PDF (subscribed) and DOCX.
- PDF pass: rendered page 1 shows UPPERCASE name starting at left margin (not centered) with thick blue rules; verify text via pdftotext and name x-position via rendered PNG.
- DOCX pass: unzip word/document.xml — header paragraphs NOT centered (no <w:jc w:val="center"/> on name/contact block, or explicit left) and name text uppercase.

## 3. /ats-checker sub-scores
- Open /ats-checker, paste resume text only (no JD), click check. Pass: total score + "Structure N/100" + hint "Add a job description to get a keyword match score."; NO "Keyword match" span.
- Paste a JD, re-check. Pass: both "Keyword match X/100" and "Structure Y/100" appear under the total.

## 4. pSEO pages
- Visit /templates/minimal, /templates/bold, /templates/elegant, /templates/engineer. Pass each: HTTP 200 (after any redirect), distinct title/content mentioning the template, and a link to /builder. Quick shell check of status codes + <title>; open one (bold) in browser.

## 5. Mobile UX walkthrough (~420px) — usability, not just overflow
- Resize window to ~420 CSS px. Walk: landing (hero + CTA tap) → /builder → load state with sample resume → edit a field → template row: 8 template buttons + 8 swatches wrap acceptably (no overflow: scrollWidth <= innerWidth; buttons not clipped) → tap a reorder arrow and undo (targets tappable) → preview readable → tap PDF: email gate or final check dialog fits and is usable → /ats-checker at 420px.
- Record observations of ANY usability issues: tap targets < ~40px, cramped rows, awkward horizontal scrolling, dialog overflow. Report as notes even if not hard failures.

Throughout: console clean; verify downloads in shell.
