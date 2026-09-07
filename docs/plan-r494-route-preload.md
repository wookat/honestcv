# R494 — per-route modulepreload: stop shipping the Builder chunk to every SPA route

## Evidence (production, 2026-09-05)

- Lighthouse network log for a cold `/samples` load: `Builder-_MDc96c0.js` (72KB transfer —
  the largest route chunk) finishes at ~247ms, **before** the route's own
  `Dashboard-DmaCJ3Uv.js` (~435ms). The Builder chunk is never executed on /samples.
- Cause: `scripts/prerender.mjs` injects a single `<link rel="modulepreload">` for the
  Builder chunk into `spa.html`, and the Worker serves that same shell for every SPA route,
  share page and 404. On /builder this is the intended parallel download; everywhere else it
  is dead weight that competes with the actual route chunk for bandwidth/priority on slow
  connections (/samples LCP 4.9s, perf 0.68 after R493).

## Fix (smallest correct)

1. `scripts/prerender.mjs`: alongside the existing Builder preload, embed a route→chunk map
   into `spa.html` as `<meta name="route-chunks" content='{"/builder":"Builder-x.js",...}'>`
   covering Builder, Dashboard (also /documents, /samples), Jobs, AtsChecker, SharedResume.
   Fail the build if any expected chunk is missing.
2. `worker/index.ts` notFound handler: new `applyRoutePreload(html, path)` — look up the
   route's chunk in the meta map and rewrite the modulepreload href; strip the preload for
   unknown routes (404s hydrate the tiny NotFound). Applied in all three shell-text branches
   (share, SPA route, unknown). `/builder` keeps its Builder preload byte-for-byte behavior.

## Non-goals

- No change to chunking, lazy() boundaries, index.html (homepage Landing preload), or the
  static SEO pages.
- No new assets or per-route shell files.

## QA (production)

- Cold /samples: no Builder chunk request; Dashboard chunk preloaded from the raw HTML.
- Cold /builder: Builder preload intact (raw HTML + network log).
- /jobs → Jobs chunk preload; /ats-checker → AtsChecker; live /s/* → SharedResume;
  dead route → no route preload.
- Lighthouse /samples re-run; R493 skeleton regression; 375px light/dark overflow + console.
