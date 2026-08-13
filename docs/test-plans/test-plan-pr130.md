# PR #130 — Text size + Line spacing controls, live test plan (cv.zalize.com, worker 001c4d34)

Deployment verified: `Builder-DMXIS6Ny.js` contains `fontScale`/`lineSpacing`, "Text size ${…}" titles, "Compact"/"Relaxed" labels, 6 aria-pressed toggles.

Code evidence (pr130 = 3b915ef):
- `src/lib/resume.ts`: `FONT_SCALE = {s:0.92, m:1, l:1.08}`, `LINE_SPACING = {compact:1.22, normal:1.35, relaxed:1.52}`; defaults m/normal.
- `src/pages/Builder.tsx` L1626+: two toggle groups in the design bar after page-size buttons (Letter/A4): "Text" S/M/L (aria-label "Text size small/medium/large") and "Spacing" Compact/Normal/Relaxed; selected has `ring-2 border-primary` + `aria-pressed=true`.
- `src/components/ResumePreview.tsx`: preview root gets `zoom: fontScaleOf(resume)` and `lineHeight: lineSpacingOf(resume)+0.1`; per-element `leading-*` classes removed.
- `src/lib/pdf.ts`: all sizes ×`fs`, line height `size*lh` instead of hard-coded 1.35.
- `src/lib/docx.ts`: run sizes `sz(n)=Math.round(n*fs)` (half-points: body 21→L=23, name 40→L=43, heading 22→L=24, contact 19→L=21, title 24→L=26); paragraph `spacing.line = round(240*lh/1.35)` → Relaxed = round(240*1.52/1.35) = **270**.
- Page indicator: "PDF export: N page(s)" above the template filter chips (existing; driven by layout estimate).

## 1. Toggles → live preview (default M/Normal unchanged)
- /builder with example resume. Assert design bar shows Text S/M/L + Spacing Compact/Normal/Relaxed next to Letter/A4; M and Normal preselected (ring + aria-pressed=true).
- Baseline: computed style of `[aria-label="Resume preview"]`: `zoom` = 1 (or absent), lineHeight 1.45. Screenshot.
- Click S → preview visibly smaller text; computed zoom 0.92. Click L → zoom 1.08. Click Compact → lineHeight 1.32; Relaxed → 1.62. Screenshots S/Compact vs L/Relaxed (denser vs airier — pixel-visible difference). Fail: computed values unchanged or no visible difference.
- Persistence: reload → selections retained (resume localStorage).

## 2. Exports
- PDF #1 at M/Normal, PDF #2 at S/Compact. Assert both have real selectable text (pdftotext contains "Jordan Reyes" + SUMMARY). Objective size check: pdftotext -bbox or pdffonts/py extraction — text font size in PDF #2 ≈ 0.92× of #1 (e.g. body 10 → 9.2). Fail: identical font sizes in content streams.
- Page indicator: note "PDF export: N page" at M/Normal; switch to S/Compact → indicator must be ≤ N (1-page example: stays 1, must not increase).
- DOCX at L/Relaxed: unzip document.xml; assert `w:sz w:val="23"` (body 21×1.08) and name `w:val="43"`, and `w:spacing ... w:line="270"`. Fail: sz 21/40 or line 240 (i.e. multipliers not applied).

## 3. Regression — golden path + console
- Reset to M/Normal. Example resume → PDF download works, pdftotext real text. Zero console errors on / and /builder.

## 4. 375px + axe
- CDP 375×812 on /builder: new Text/Spacing buttons visible, tappable, no horizontal overflow (scrollWidth ≤ 375). Tap S at 375px → preview changes.
- axe-core in-page on / and /builder: 0 violations; specifically toggle buttons have aria-pressed + discernible text.

## 5. CWV quick check (/)
- Fresh hard reload of / with PerformanceObserver capturing LCP + CLS. Pass: LCP < 2.5s (warm CDN; report actual number), CLS < 0.1. Fonts preloaded so hero text shouldn't shift.

Recording: annotate per test; use existing QA browser state (honestcv.qa=1, email gate already unlocked with qa-beta@zalize.com).
