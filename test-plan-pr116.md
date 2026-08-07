# PR #116 — Visual upgrade round 1 (templates 12→22, ScoreRing, brand) — Live Test Plan

Live at cv.zalize.com, worker 80e03670, bundle `assets/index-Dz3ALMf0.js` (shell-verified: contains Horizon/Quartz/Cobalt, "All 22" ×2, zero "All 12"). All 10 new /templates/* pSEO pages return 200. favicon.svg live = new document+check mark. **Known issue found in setup: live /og.png is the OLD file (md5 = origin/main's og.png, cf-cache-status HIT) — Cloudflare edge cache serving stale asset; new og.png (213395 bytes) not being served.** localStorage: honestcv.qa='1', honestcv.subscribed='1' (skip email gate). Hard refresh before testing.

Code evidence: src/lib/templates.ts (10 new metas, `band:true` on horizon/metro/scholar/ink/ruby; `accentTint()` 12% mix); src/components/TemplateThumb.tsx L24-31 (band thumbs get full-width tinted strip); ResumePreview.tsx L26-29 (band h3 background=accentTint, padding 3px 6px); pdf.ts L198-219 (drawRectangle tint + real drawText); docx.ts L40-42 (w:shd fill=accentTint hex); ScoreRing.tsx (role="img" aria-label "Score N out of 100", ring + count-up via motion lib, reduced-motion → instant); motion.ts prefersReducedMotion; AtsChecker.tsx L239 (ScoreRing replaces plain span); Landing.tsx L85-92 hero radial mesh, L153 "22 ATS-safe templates"; Logo.tsx/Layout.tsx LogoMark in header.

## 1. Builder: 22 templates, band styling, deep link
- Open /builder?template=horizon (hard refresh). Pass: template picker shows 22 thumbnails (count rows), Horizon selected; band-template thumbs (Horizon/Metro/Scholar/Ink/Ruby) show a full-width tinted band strip vs plain accent bar on others (zoom screenshot).
- Load example resume. Pass: preview section headings (SUMMARY/EXPERIENCE…) render with a visible teal-tinted band background behind real text (zoom). Non-band template (e.g. Cobalt) headings have NO band, thick rules instead.
- Note: prior accent choice overrides template hue — reset accent if needed (black swatch or fresh localStorage).

## 2. Exports keep band + real text
- Download PDF on Horizon. Shell: pdftotext extracts headings + body (real text); pdftoppm render shows tinted band rectangles behind headings.
- Download DOCX. Shell: unzip document.xml contains `w:shd` with fill = tint hex (accentTint('#0e7490') = e2eef3-ish; compute exact) on heading paragraphs, and no bottom border on those.

## 3. /ats-checker ScoreRing
- Paste sample resume + JD, click check. Pass: animated ring gauge visible with count-up ending at score N; element role="img" aria-label "Score N out of 100"; screenshot mid-animation if possible + final.
- Reduced motion: open second chromium instance with `--force-prefers-reduced-motion`, same check. Pass: score shows final value instantly (no partial ring on first paint screenshot ~immediately after result renders).

## 4. Brand + landing
- Landing (hard refresh): hero shows subtle radial gradient mesh (screenshot); header logo = new document+check mark (zoom); gallery heading "22 ATS-safe templates, one honest layout rule" with 22 chips; pricing "All 22 ATS-friendly templates"; FAQ "all 22 templates".
- Tab favicon = new mark (zoom on tab). og.png: report stale-cache finding (see header).

## 5. Regression: mobile + axe + golden path
- 375px viewport: /, /builder, /ats-checker — document.scrollWidth ≤ innerWidth; screenshots.
- Shell `npx @axe-core/cli` on the three URLs — pass: 0 violations (or report any).
- Golden path already covered by step 2 downloads (edit a field first to show live preview).

Throughout: console clean; annotate recording.
