# R459 — theme-aware static loading skeleton in the SPA shell

## Audit (SOP-10 four dimensions, first-hand production evidence)

- Route health: 7 SPA routes clean (titles/h1/overflow/console — r458_audit.py rerun).
- Static surface: og:image (og2.png, 200/213KB) present on landing, SPA routes and
  static pages; hashed assets `max-age=31536000, immutable`; fonts 7d; pages 60s. Clean.
- Rejected candidates (false positives):
  - Auto-fit "please try again" copy: unreachable when the pdf chunk failed —
    the button only renders when `pdfLength !== null`, i.e. the chunk already loaded.
  - 404 shell carrying a Builder modulepreload + Builder-shaped skeleton: intentional
    design in `scripts/prerender.mjs` (core conversion route preload).

## Verified defect (functional depth / visual honesty in dark mode)

CDP against production, fresh profile, `honestcv.theme='dark'`, entry chunk blocked
to hold the pre-hydration state:

- `html.class="dark"`, `body` background `oklch(0.16 0.015 260)` (near black),
  skeleton blocks `rgb(226,232,240)` — hardcoded `#e2e8f0` in the spa.html skeleton
  (`scripts/prerender.mjs`). Screenshot: glaring light blocks on a dark page.
- The R451 pre-paint theme script sets `html.dark` before first paint, and the React
  `RouteFallback` mirror is theme-aware via `bg-muted` — only the static skeleton
  ignores the theme. Every dark-theme visitor on a slow connection gets a bright
  flash on every cold SPA load (all non-`/` routes and 404s serve spa.html).

## Fix (smallest idiomatic change — scripts/prerender.mjs only)

Move the block background out of inline styles into the skeleton's existing inline
`<style>` as a class:

```css
.hcv-sk{background:var(--muted,#e2e8f0)}
html.dark .hcv-sk{background:var(--muted,oklch(0.26 0.02 260))}
```

- Uses the design token when the (render-blocking) stylesheet has loaded; literal
  fallbacks mirror `--muted` light/dark from src/index.css otherwise.
- Markup: `background:#e2e8f0` inline declarations become `class="hcv-sk"`
  (side pane keeps `hcv-sk-side` too). index.html (prerendered landing) unchanged.
- React RouteFallback unchanged (already correct).

## Validation

- `npm run typecheck && npm run lint && npm run build` (verify-dist gate).
- Deploy `npm run deploy`; production QA via testing agent:
  dark skeleton blocks now dark-muted (no bright flash), light mode unchanged,
  hydrated pages unchanged, 375px light/dark, zero console errors, storage restored.
