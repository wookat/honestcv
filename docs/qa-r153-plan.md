# R153 QA plan — Guide links in HealthDialog (commit 2bda964, bundles index-D19vxJls.js / Builder-vULJCdcJ.js)

Code evidence (src/pages/Builder.tsx @2bda964): `DIMENSION_GUIDES` map (keywords→/guides/resume-keywords, ats-structure→/guides/ats-friendly-resume, quantification→/guides/resume-bullet-points, verbs→/guides/resume-action-verbs, brevity→/guides/how-long-should-a-resume-be, buzzwords→/guides/common-resume-mistakes, consistency→/guides/best-resume-format, completeness→/guides/best-resume-format). Each dimension row in HealthDialog gets `<a target="_blank" rel="noopener" aria-label="Read the {label} guide — opens in a new tab" class="… min-h-10 … underline sm:min-h-0"><BookOpen/>Guide</a>` after the label/Fix→. "Keyword match" row renders only when a JD is set (paste into Target job → Job description textarea).

Fixture: standard full resume (/tmp/r1371_before.json).

## G1 Bundle: cache-busted load, assert exactly index-D19vxJls.js + Builder-vULJCdcJ.js; baseline storage clean.

## G2 Desktop (1600) links present + correct hrefs
Open dialog via nav score chip. PASS: every visible dimension row (7 without JD: ATS structure, Completeness, Quantified impact, Action verbs, Brevity, Buzzword-free, Consistency) has an `a[aria-label^="Read the"]` with text "Guide", underline + BookOpen icon visible in screenshot; hrefs match the map exactly; all `target="_blank" rel="noopener"`. FAIL if any row missing a link or href mismatched.

## G3 Click-through (2 links: one health dim, one ATS dim)
Click "Guide" on Quantified impact → NEW tab opens at https://cv.zalize.com/guides/resume-bullet-points showing real guide content (title/h1 visible in screenshot, not 404); original tab still shows the open dialog. Repeat for ATS structure → /guides/ats-friendly-resume. FAIL if same-tab navigation, 404/blank page, or dialog closed in original tab.

## G4 Keyword match row
Paste a short JD into Target job → Job description textarea. Reopen dialog → "Keyword match" row present with Guide href /guides/resume-keywords. FAIL if row missing its Guide link or wrong href.

## G5 Fix → regression
In the dialog, click a "Fix →" button → dialog closes and editor jumps to the relevant section (card below sticky nav). PASS criteria: dialog gone + expected section card near top with ring/scroll.

## G6 375px
Emulate 375: open dialog via chip tap. PASS: Guide link rect height ≥ 40 (min-h-10 below sm); dialog content rect right ≤ 375 & left ≥ 0 (no horizontal overflow); touch tap on a Guide link opens the guide (new tab/target) with content. FAIL otherwise.

## G7 R152 regression
Score chip visible/pinned in nav, emerald number equals "Full health report — N/100" link; click opens dialog. (Covered implicitly by G2 entry — assert explicitly once.)

Cleanup: restore localStorage to exactly ["honestcv.clientId","honestcv.qa"] (JD stored under honestcv key? remove any extra keys), close extra guide tabs, fresh desktop tab innerWidth 1600. No AI/share/payment/export/delete.
