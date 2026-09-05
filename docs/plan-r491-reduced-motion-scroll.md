# R491 — programmatic smooth scrolls respect prefers-reduced-motion

## Evidence (production CDP, prefers-reduced-motion: reduce emulated)

- `/builder?example=software-engineer`, click the "Skills" section-navigator chip:
  `scrollY` sampled every 40ms animated `0 → 4 → 66 → … → 3669` over ~800ms —
  a long animated scroll despite the OS-level reduced-motion preference.
- `matchMedia('(prefers-reduced-motion: reduce)').matches === true` confirmed in-page.
- The global CSS rule in `index.css` (`scroll-behavior: auto !important` under
  `@media (prefers-reduced-motion: reduce)`) does NOT cover these calls: per the
  CSSOM View spec, an explicit `scrollIntoView({ behavior: 'smooth' })` ignores
  the CSS `scroll-behavior` property — only `behavior: 'auto'` consults it.
- Hash navigation on `/dashboard#samples` lands instantly under reduce today only
  because the browser's native hash jump fires first; the React effect then issues
  a redundant smooth `scrollIntoView`. On the cold-load path fixed in R490 (target
  mounts after examples load) the smooth animation is the only scroll, so it would
  animate under reduce.

## Root cause

Three call sites hardcode `behavior: 'smooth'`:

- `src/pages/Dashboard.tsx:298` — hash anchor effect (R490)
- `src/pages/Builder.tsx:670` — section-navigator jump (JUMP_EVENT)
- `src/pages/Builder.tsx:1332` — score-finding "jump to entry"

WCAG 2.3.3 (Animation from Interaction) / WAI technique C39: motion triggered by
interaction should be disabled when the user requests reduced motion.

## Fix (smallest)

`src/lib/motion.ts` already exports `prefersReducedMotion()` (used by `useCountUp`
since R452). At each of the three sites, replace the literal with:

```ts
behavior: prefersReducedMotion() ? 'auto' : 'smooth'
```

evaluated at call time (preference can change while the app is open). No other
behavior change: same targets, same `block` options, same timing.

## Non-goals

- No change to `App.tsx` ScrollReset (already instant `scrollTo(0,0)`).
- No change to `Layout.tsx` skip-link `scrollIntoView()` (default is instant).
- No change to CSS animations (already covered by the global reduce rule).

## QA plan (production, reduce emulated + not emulated)

1. Reduce: Builder section-navigator chip jump lands instantly (single-step scroll).
2. Reduce: score-finding jump-to-entry lands instantly.
3. Reduce: cold `/dashboard#samples` lands at target with no animation.
4. No emulation: all three still animate smoothly (unchanged default).
5. Regressions: R490 cold-load hash, R489 push reset + POP restore, flash ring
   still appears on jumps, 375px light/dark overflow, console clean.
