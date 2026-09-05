# R452 — drop the `motion` dependency from the entry bundle

## Production evidence (first-hand)

- Post-R451 Lighthouse (simulated mobile, home): perf 83, BP 100, SEO 100.
  `render-blocking-resources` no longer lists /theme.js (R451 confirmed);
  the top remaining flagged item is `unused-javascript`: ~60 KiB estimated
  savings on `assets/index-*.js` (126.7 KB transfer, ~61.7 KB unused).
- Source-map breakdown of the entry chunk (vite build --sourcemap):
  - react-dom 532 KB (required)
  - **motion-dom 204 KB + framer-motion 24 KB + motion-utils 10 KB + tslib 17 KB**
  - fflate 88 KB (extractFile; upload path)
  - app code (Landing/ResumePreview/…) as expected.
- `motion` is imported in exactly one place: `src/lib/motion.ts` uses
  `animate(from, to, { duration, ease: 'easeOut', onUpdate })` for the
  ScoreRing count-up. Nothing else in src/worker/scripts references it.

## Root cause

`useCountUp` (26-line helper) pulls the full `motion` animation engine
(~250 KB source, tens of KB of gzip transfer) into the eagerly-loaded entry
chunk for a numeric tween that `requestAnimationFrame` covers in ~15 lines.

## Fix (narrow)

- Rewrite `useCountUp` in `src/lib/motion.ts` as a rAF loop with the same
  cubic ease-out and reduced-motion semantics; keep the exported API
  (`useCountUp`, `prefersReducedMotion`) byte-compatible for callers.
- Remove `motion` from package.json dependencies.
- ScoreRing and all callers unchanged.

## Acceptance

- tsc / eslint / build green; entry `index-*.js` shrinks materially
  (motion-dom/framer-motion/motion-utils absent from its source map).
- Production QA: ScoreRing count-up still animates (home hero + builder
  score), reduced-motion renders final value instantly, zero console
  errors, R451 (no theme.js, hashed-CSP inline) regression, 375 light/dark.

## Out of scope (banked)

- fflate (88 KB) eagerly bundled via `@/lib/extractFile` static imports on
  Landing/AtsChecker/Builder/Dashboard — candidate for a later round
  (dynamic import at upload time).
