# R470 — homepage LCP element no longer hides behind its entrance fade

## Evidence (first-hand, production)

Lighthouse against https://cv.zalize.com/ (2026-08-31):

- Mobile: performance 0.89, LCP 3.1 s (score 0.74) — the only failing metric; a11y/BP/SEO all 1.0.
- Desktop: LCP breakdown — TTFB 44 ms, **element render delay 405 ms** (mobile trace: 557 ms).
- LCP element on both form factors: the hero paragraph
  `main#main > section.relative > div.mx-auto > p.text-muted-foreground`
  ("Build an ATS-friendly resume in minutes …").

Root cause: the homepage is prerendered (hero text is in the raw HTML), but every
hero element carries `.animate-rise`, whose keyframes start at `opacity: 0` with
`animation-fill-mode: both` and staggered `--rise-delay` (h1 60 ms, p 120 ms,
CTA 180 ms). With fill-mode `both`, the LCP paragraph is fully transparent until
its 120 ms delay elapses and the 600 ms fade brings it in — the browser cannot
paint the largest element until then, so LCP is pushed out by the entrance
animation, wasting the prerendered HTML head start. This is the standard
"don't fade in your LCP element from opacity 0" guidance (web.dev/lcp).

## Fix (smallest change)

- `src/index.css`: add a transform-only sibling of `rise`:
  `@keyframes rise-slide { from { transform: translateY(14px) } to { transform: none } }`
  and `.animate-rise-slide` with the same duration/easing/`--rise-delay` contract.
- `src/pages/Landing.tsx`: the four above-the-fold hero elements (Badge, h1,
  lead paragraph, CTA row) switch `animate-rise` → `animate-rise-slide`.
  They stay visible from the first frame and keep the upward slide, so the
  staggered motion design is preserved; below-the-fold blocks (product mock,
  upload button) keep the full fade.

## Non-goals

- No change to `prefers-reduced-motion` handling (global override already caps
  all animations at 0.01 ms).
- No change to other routes, static pages, or the `rise` keyframes themselves.

## QA

- Lighthouse before/after on production (mobile + desktop): element render
  delay collapses; LCP no longer waits for the fade.
- Hero renders text from first paint (CDP screenshot before animation end).
- Visual: slide-up motion still present; 375px light/dark zero overflow; zero
  console errors; reduced-motion unaffected; storage untouched.
