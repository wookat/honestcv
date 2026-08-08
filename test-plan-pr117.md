# PR #117 — Design upgrade round 2 — Live test plan (cv.zalize.com, worker 20635016)

Setup verified: bundle `assets/index-Duam7KTd.js` contains "Banded headings"; live `/og2.png` md5 = branch file (e24eed2f…, 1200×630, dark avg 28/36/54); index.html og:image → og2.png. QA flags honestcv.qa/subscribed already set. Code evidence: src/lib/templates.ts TEMPLATE_FILTERS (all/serif/sans/banded/minimal; banded = band:true → 5 templates: Horizon/Metro/Scholar/Ink/Ruby); Landing.tsx L161-177 chips with counts "(N)"; Builder.tsx L1479-1500 chips (no counts) filtering picker; Builder.tsx L453-455 setDownloaded(fmt) → Check `.animate-pop text-emerald-*` for 1800ms then revert; index.css @keyframes pop + prefers-reduced-motion kill-switch; AtsChecker.tsx ScanIllustration when resumeText<30; Builder.tsx DraftIllustration in "Starting fresh?" card (no name & no summary).

## 1. Landing gallery filters
- Open / (hard refresh). Pass: above gallery, 5 chips "All (22) / Serif (N) / Modern sans (N) / Banded headings (5) / Minimal (N)"; "All" has aria-pressed=true and filled style.
- Click "Banded headings". Pass: chip becomes filled/aria-pressed=true; grid shows exactly 5 thumbnails (Horizon, Metro, Scholar, Ink, Ruby). Click "All" → 22 again.

## 2. Builder picker filters
- Open /builder. Pass: filter chip row above template thumbnails (labels without counts). Click "Serif" → only serif templates remain (e.g. Classic present, Modern absent); click "Banded headings" → 5 thumbs; click "All" → 22.

## 3. Export success animation (golden path)
- Edit a field (live preview updates — regression). Click PDF. Pass: button icon shows spinner then a GREEN CHECK (emerald) replacing the download icon; screenshot within 1.8s window; after ~2s icon reverts to Download. Repeat quick check on DOCX. Downloads verified in shell (pdftotext).
- Reduced motion (Chrome --force-prefers-reduced-motion): click PDF → check appears WITHOUT pop scaling (can't screenshot scale reliably; assert check still appears and animation CSS is killed globally — verify via computed animation-duration 0.01ms on .animate-pop element via console, one-line check).

## 4. Empty-state illustrations
- /ats-checker with empty resume textarea. Pass: document+magnifier SVG visible below disabled "Check my ATS score" button (screenshot); disappears once ≥30 chars pasted.
- /builder with cleared resume (temporarily clear honestcv.resume → fresh state). Pass: "Starting fresh?" card shows document+pencil SVG. Restore sample after.

## 5. og2.png + template-preserve fix
- Shell: og:image meta on / points to /og2.png; live og2.png = new dark card (done in setup; re-assert in report).
- /builder?template=horizon → click "Load an example resume". Pass: template stays HORIZON (picker highlight + banded preview headings), NOT Classic.

## 6. Regression
- 375px (CDP emulation): / and /builder scrollWidth ≤ 375 with the new chip rows.
- axe (in-page injection) on / and /builder: 0 violations.
- Console clean throughout.
