# PR #129 (design system D1-D5) — live test plan, cv.zalize.com (worker 04c3e758)

Deployed verified: index-CxaNpXdo.js + index-DlfHMLhu.css contain `animate-rise`, `min-h-11 … sm:min-h-8` chips, Sora/Inter @font-face; /fonts/{inter,sora}-latin.woff2 serve 200 (48256/25284 B); AtsChecker chunk has "What do these scores mean"; Builder chunk has the `plain` explainer strings.

Code evidence (commit 1b89897):
- index.html: `<link rel="preload" as="font">` for both woff2.
- index.css: `h1,h2,h3:not([data-resume-preview] *) { font-family: var(--font-display) }` → Sora for app headings, resume preview keeps template fonts. `.animate-rise` keyframe rise 0.6s with `--rise-delay`; global `prefers-reduced-motion: reduce` kill-switch applies.
- Landing.tsx: badge/h1/p/CTA get `animate-rise` with delays 0/60/120/180ms; feature cards + template tiles get `hover:-translate-y-0.5 hover:shadow-md`; chips `min-h-11 … sm:min-h-8`.
- button.tsx: `active:scale-[0.98]`, default variant `hover:shadow-md`.
- AtsChecker.tsx: `<details>` "What do these scores mean?" with Keyword match / Structure / What to do items, rendered under sub-scores (needs results; use "see an example score").
- Builder.tsx HealthDialog: italic `<p class="…italic">{d.plain}</p>` per dimension (6 strings in guidance.ts).

Setup (before recording): honestcv.qa='1'; keep honestcv.shared to skip email gate (already set from last run) or re-use qa-beta@zalize.com.

## 1. Fonts (D1)
- Load / fresh; via console: `getComputedStyle(document.querySelector('h1')).fontFamily` starts with Sora and `document.fonts.check('700 16px Sora')===true`; body font-family starts with Inter. Fail: system-ui/Arial actually rendering.
- Visual: hero h1 in Sora (distinct geometric face) — screenshot.
- Builder preview headings unchanged: /builder with example resume (Classic template) → preview name/h3 computed font-family is Georgia (serif), NOT Sora. Fail: preview headings show Sora.

## 2. Hero rise-in + hover lift + press (D2)
- Hard reload / and screenshot within first ~300ms: badge/h1/p/CTA partially transparent/offset (staggered). Then settled frame: fully visible. Fail: no visible difference or elements never appear.
- Feature card hover: mouse over a "What you get" card → screenshot shows shadow + slight lift (compare non-hovered). Computed transform translateY(-2px).
- Template tile hover: same on a gallery tile.
- Button press: mousedown on hero CTA → computed transform scale ≈0.98 while held (CDP or screenshot).
- Reduced motion (CDP emulated `prefers-reduced-motion: reduce`): `.animate-rise` computed animation-duration 0.01ms; hero content instantly visible on reload.

## 3. 44px chips at 375px (D3)
- CDP 375px on /: gallery chip `getBoundingClientRect().height >= 44`; desktop (normal width) height ~32 (sm:min-h-8). No horizontal overflow (scrollWidth ≤ 375).

## 4. ATS checker expander (D4)
- /ats-checker → click "see an example score" (0 AI quota) → results show; below sub-scores a collapsed `<details>` "What do these scores mean?" — click to expand → three items: Keyword match / Structure / What to do ("Aim for 70+"). Screenshots collapsed + expanded. Fail: expander absent or empty.

## 5. Health report plain-language lines (D5)
- /builder (example resume) → "Full health report" link → dialog: each of the 6 dimensions shows an italic line under the summary, e.g. Quantified impact → "Numbers make claims believable — “cut costs 18%” beats “reduced costs” every time." Verify at least 2 exact strings visually. Fail: italic lines missing.

## Regression (labeled)
- Golden path: landing → Start free trial → builder → Load example resume → PDF download; pdftotext real text.
- 375px: / and /builder scrollWidth ≤ 375.
- Console: zero errors on /, /builder, /ats-checker.
