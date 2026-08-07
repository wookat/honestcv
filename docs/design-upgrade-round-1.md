# Design & template upgrade — round 1 (August 2026)

Scope: boss directive "视觉/品牌/特效升级" + "大量扩充简历模板". Evidence labels:
observed = firsthand browser/source behavior · claim = public marketing/HTML claim ·
inference = interpretation of public behavior · blocked = not safely observable.

## Visual research

- Enhancv landing (observed, screenshot `~/screenshots/ss_a63ad10d.png`): light background
  with soft radial gradient mesh behind the hero, green primary CTA + outlined secondary
  CTA pair, purple accent word inside the H1, review-count social proof row, floating
  rotated resume-card artwork. Framework marker `__next` (observed) → Next.js (inference).
- Resume.io homepage source (observed): loads the Inter typeface. Enhancv also ships
  Inter (observed in HTML source). Our stack already uses Inter — kept.
- FlowCV source (observed): `_astro` asset prefix → Astro static output (inference).
- Linear/Stripe (observed, source capture): tight letter-spacing display headlines,
  restrained gradients, `font-family: var(--font-monospace)` tokens (Linear),
  self-hosted woff2 preloads (Stripe). Pattern adopted: subtle dual radial gradient
  behind our hero, `tracking-tight` headline already in place.

## Open-source resume tooling research

- Reactive Resume (rxresu.me, AGPL — studied for ideas only, no code copied): template
  variety comes from parametric axes (accent, heading treatment, alignment) rather than
  bespoke layout engines (observed in rendered templates from round-5 walkthrough).
  Several of its templates use a tinted band behind section headings — real text on a
  background rectangle, which stays ATS-parseable.
- Open Resume / JSON Resume themes (public repos, claim/inference): same parametric
  pattern; PDF output via client-side generators, matching our pdf-lib approach.

## What shipped

1. **Template system: new `band` axis + 10 new templates (12 → 22).**
   `band: true` renders the section heading on a light accent tint (`accentTint()`,
   12% blend to white) in all three renderers — HTML preview, pdf-lib rectangle,
   DOCX paragraph shading. New templates: Horizon, Metro, Scholar, Ink (banded),
   Coral, Atlas, Prairie, Quartz, Ruby (banded), Cobalt. Each has tags + a pSEO page
   (`/templates/<id>`, sitemap 57 → 67 URLs).
2. **Motion layer (Motion library, v12.43.0 pinned).** `useCountUp()` hook +
   `<ScoreRing>` animated circular gauge on /ats-checker (count-up + ring draw).
   Global `prefers-reduced-motion` CSS kill-switch added; the hook renders the final
   value immediately under reduced motion.
3. **Brand refresh.** The old favicon was a leftover microphone mark (wrong product).
   New mark: document + verified-check, shipped as `favicon.svg`, `<LogoMark>` in the
   site header, and a regenerated 1200×630 `og.png` with the dark-gradient brand card.
4. **Landing hero gradient mesh** (Enhancv/Stripe-inspired, pure CSS, aria-hidden).
5. Copy updated 12 → 22 templates site-wide.

## Stack assessment (unchanged conclusion)

React 19 + Vite + Tailwind v4 + shadcn/Radix remains the right base; competitors use
Next.js/Astro for marketing SEO, which our static build-seo pipeline already covers.
Motion added as the animation library (mature, tree-shakeable) instead of GSAP
(licensing overhead, larger footprint for our limited use).
