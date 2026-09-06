# R517 — paint the workspace route header from the raw HTML (LCP)

## First-hand evidence (production, 2026-08-31)

- Lighthouse across all 7 main routes: CLS is now 0 everywhere (R513–R516 closed the last shifts).
  The dominant remaining metric on the workspace routes is LCP:
  /jobs 3.8s, /samples 4.0s, /documents 4.0s, /dashboard 4.2s (perf 0.75–0.83).
- `lcp-breakdown-insight` on /jobs, /dashboard and /samples attributes essentially all of it to
  **element render delay** (574–941ms after a ~43ms TTFB in the lab run): the LCP element on each
  of these routes is the static header subtitle `<p class="text-muted-foreground">…</p>`
  ("Remote jobs via Remotive…", "One copy per job…", "Start from a proven example…").
- These headers are fully static build-time strings, but they only paint after the entry chunk +
  route chunk download, parse and hydrate. The R459 pre-hydration skeleton paints gray bars at
  TTFB, so the largest *text* paint still waits for JS.

## Root cause

The SPA shell (`spa.html`) ships one generic skeleton for every route. The worker already rewrites
it per-route (R429/R430 canonical+meta, R494 modulepreload, R496 examples preload), but nothing
injects the visible route header, so the LCP text cannot paint before hydration.

## Fix (minimal)

1. `scripts/prerender.mjs`: embed a `route-headers` JSON map (path → `{h1, sub}`) as a
   `<meta name="route-headers">` tag, mirroring the `route-chunks` pattern, and drop an
   `<!--hcv-route-header-->` placeholder into the skeleton where the heading bar sits. Routes:
   /dashboard, /documents, /samples, /jobs (their h1/subtitle strings copied verbatim from the
   page components; build fails if the placeholder or map goes missing).
2. `worker/index.ts` `applyRoutePreload()` (or sibling helper): for a known route, replace the
   placeholder with real `<h1>` + `<p>` markup (inline styles matching text-2xl bold / text-sm
   muted) and remove the generic heading skeleton bar; unknown routes keep the bar.

Hydration then swaps the skeleton for the real page as before — same text at the same size, so
the early paint remains the LCP candidate.

## Non-goals

- /builder TBT 1540ms (entry-chunk script eval floor) — stays banked; tree-level splitting is a
  separate architectural round.
- No change to hydration, RouteFallback, or the R459 skeleton for unmapped routes.
- No SSR of page bodies.

## Verification

- Local: tsc, eslint (changed files), build, verify-dist; raw `curl` of each route shows the
  correct header text exactly once.
- Production: Lighthouse LCP on /jobs, /dashboard, /samples, /documents before/after; CLS must
  stay 0 on all four (throttled CDP buffered layout-shift probe); 375px/1280px no overflow; no
  console errors; QA leaves only baseline storage keys.

## Risks / honest caveats

- Header strings are duplicated between components and the prerender map; a copy change in a page
  without updating the map re-introduces the delayed-paint gap for that route (documented here and
  in handoff; a grep in prerender could later assert the strings still exist in src).
- LCP improvement depends on the browser treating the identical hydrated text as no larger than
  the early paint; verified empirically rather than assumed.
