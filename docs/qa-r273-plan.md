# QA plan — R273 export-error alert contrast fix (production cv.zalize.com)

Bundle `index-BywzwJnU.js` (confirm in loaded resource entries). Zero non-quota AI; CDP screenshots
(recording down since R166); restore baseline ["honestcv.clientId","honestcv.qa"] + system theme.

Code-traced: Builder.tsx:1753 and Dashboard.tsx:655 alert bar now
`border-red-300 bg-red-50 text-red-800` (was `border-destructive/40 bg-destructive/10 text-destructive`,
light contrast ≈3.75:1 in R271). index.css:161/167 dark palette: red-50 = oklch(0.28 0.05 25) bg,
red-800 = oklch(0.86 0.12 24) text — same classes valid in dark, no dark: overrides.

## C1 — Builder alert trigger + contrast (primary)
Seed resume with Arabic in summary (`مرحبا`), click PDF (+ Download anyway).
- No file downloads; role=alert bar appears with "PDF export does not support some characters".
- LIGHT: read getComputedStyle color + effective bg (walk ancestors for non-transparent bg) of the
  alert <span> AND the Dismiss button; computed WCAG contrast MUST be ≥4.5:1 (R271 measured 3.75 —
  broken build fails this). Also pixel-measure from screenshot as corroboration.
- DARK (set honestcv.theme dark + class): same measurement ≥4.5:1.
- Screenshots both themes; Dismiss click removes the bar.

## C2 — Dashboard alert (career doc path)
With the Arabic draft still current, career doc PDF button on /dashboard → same alert on Dashboard,
computed light-mode contrast ≥4.5:1, Dismiss works, no file.

## C3 — Regression
- Latin resume → PDF downloads, no alert.
- CJK (张伟) resume → PDF downloads (noto fetched), no alert.

## Discipline
`__aiReqs` [] and no unhandled rejections throughout; contrast numbers reported exactly;
ambiguous → inconclusive. Screenshots /home/ubuntu/screenshots/r273_*.

## Findings (appended after run)
