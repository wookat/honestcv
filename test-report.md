# PR #116 — Visual upgrade round 1 — Live test report (cv.zalize.com)

Tested live against production (worker `80e03670`, bundle `assets/index-Dz3ALMf0.js` verified fresh via hard refresh). QA flags set (`honestcv.qa='1'`, `honestcv.subscribed='1'`). AI/Paddle out of scope.

## Summary
All planned assertions **passed**, with **one deployment finding**: the live `/og.png` is still the OLD image — Cloudflare edge cache (`cf-cache-status: HIT`) serves the pre-PR file (md5 `0adf8191…` = origin/main, avg color light 87/95/133) instead of the new dark card in the branch (md5 `e24eed2f…`, 213,395 bytes, avg color dark 28/36/54). Both are 1200×630. A cache purge of `/og.png` is needed. Also a minor UX note: "Load an example resume" resets a deep-linked template back to Classic (the example's `templateId` overwrites the URL selection).

## 1. Templates 12 → 22 (band headings)

| Landing gallery — 22 thumbs, band strips visible | Builder picker — 22 thumbnails, Horizon selected |
|---|---|
| ![Gallery](https://app.devin.ai/attachments/67c7c3da-9d8f-4229-8a4d-875ece419307/ss_zoom_2d6b7287.png) | ![Picker](https://app.devin.ai/attachments/01786b65-4ca0-4789-afcb-a4b18bb4ecff/ss_d8797e63.png) |

- ✅ Builder picker shows 22 thumbnails; Horizon/Metro/Scholar/Ink/Ruby thumbs show full-width tinted band strips (others show plain accent bars)
- ✅ Landing gallery shows all 22 templates; heading "22 ATS-safe templates"; pricing "All 22 ATS-friendly templates"; FAQ "all 22 templates"; zero "All 12" in bundle
- ✅ Deep link `/builder?template=horizon` applies Horizon (picker highlighted, meta line "Horizon: Teal heading bands…")
- ✅ Preview: section headings render on teal-tinted bands, real text (h3 with `background: #e2eef2`-equivalent tint)

![Horizon preview band](https://app.devin.ai/attachments/794acdc8-e621-46e5-8857-c65c87e781f7/ss_zoom_9cd8c7a1.png)

- ✅ **PDF** (Horizon): pdftotext extracts all headings/body (selectable real text); content streams contain tint fill `0.886 0.933 0.949 rg` (= accentTint(#0e7490) → rgb 226/238/242) and accent text color `0.055 0.455 0.565` (#0e7490); rendered page shows bands:

![Horizon PDF rendered](https://app.devin.ai/attachments/83d24d20-a426-42e1-b068-c123d9fe6283/horizonpdf-1.png)

- ✅ **DOCX**: `word/document.xml` contains `<w:shd w:fill="e2eef2" w:val="clear"/>` ×4 (SUMMARY/EXPERIENCE/EDUCATION/SKILLS) and band headings have no bottom border
- ✅ pSEO: `/templates/{horizon,metro,scholar,ink,coral,atlas,prairie,quartz,ruby,cobalt}/` all HTTP 200 with per-template SVG layout previews, builder CTAs (`/builder?template=X`), cross-links to all 21 other templates, and the QA-aware beacon

## 2. ScoreRing on /ats-checker

| Normal — caught mid count-up (16, ring drawing) | Final — 68 with full ring |
|---|---|
| ![Mid-animation](https://app.devin.ai/attachments/b1bee08e-2d3b-4ac0-a290-80315a6c3834/ss_76f56878.png) | ![Final](https://app.devin.ai/attachments/3a3d87a0-3c31-4784-b2be-70181bd6640f/ss_zoom_c56003b1.png) |

- ✅ Count-up + ring-draw animation observed (screenshots at 16 → 30 → 68)
- ✅ `role="img"`, `aria-label="Score 68 out of 100"` verified in DOM
- ✅ Reduced motion: separate Chrome launched with `--force-prefers-reduced-motion` — score shows 68 with fully drawn ring on the first frame after clicking, no count-up:

![Reduced motion instant](https://app.devin.ai/attachments/fdb75611-4004-4378-bce9-c9e9a8282c56/ss_zoom_6a72ecac.png)

## 3. Brand + landing
- ✅ Live `/favicon.svg` is the new document+check mark (no microphone); same LogoMark in the site header (zoom-verified) and browser tab
- ✅ Hero shows the subtle radial-gradient mesh (indigo/emerald wash behind the headline)
- ⚠️ **og.png STALE at the edge**: HTTP 200 and 1200×630, but bytes = old image (CF cache HIT). New dark card is in the deployment but not served. Needs a Cloudflare cache purge for `/og.png`.

## 4. Regression (375px + axe + golden path)

| /ats-checker at 375px | /builder at 375px |
|---|---|
| ![Checker mobile](https://app.devin.ai/attachments/50cf973c-4cc4-4436-b6bd-9a01386f482f/ss_37148de2.png) | ![Builder mobile](https://app.devin.ai/attachments/e105e80b-ebd2-4cfa-9f77-18af53934be6/ss_c34beaa3.png) |

- ✅ 375px viewport (CDP device emulation): `/`, `/builder`, `/ats-checker` all scrollWidth 360 ≤ 375, no horizontal overflow
- ✅ axe-core 4.10.2 run in-page on all three URLs: **0 violations each**
- ✅ Golden path: edited Full name → preview updated live; PDF + DOCX downloaded and shell-verified (real text, correct content)
- ✅ Console: zero errors across all pages
- ℹ️ Minor UX: clicking "Load an example resume" after `/builder?template=horizon` reset the template to Classic (example data includes `templateId: classic`); re-selecting Horizon worked

## Artifacts
- Recording: `/home/ubuntu/screencasts/rec-2dddffc2-9f34-4106-b9e8-a46d5437ed22/rec-2dddffc2-9f34-4106-b9e8-a46d5437ed22-edited.mp4`
- Downloads: `~/Downloads/jordan-reyes-resume (1).pdf` (Horizon), `~/Downloads/jordan-reyes-resume.docx`
