# R496 — preload examples.json on the routes that fetch it on mount

## Evidence (production, 2026-08-31)

Lighthouse network-dependency-tree on cold `/dashboard` (entry `index-rPYDlg2J.js`):

```
/dashboard (107ms)
└─ /assets/index-rPYDlg2J.js (172ms)
   └─ /assets/api-….js (339ms)
      ├─ /examples/examples.json (653ms)   ← 16.7KB, discovered only after JS runs
      ├─ /api/billing/status (647ms)
      └─ /api/ai/quota (717ms)
```

`examples.json` sits on the critical request chain but is only discovered after the
entry chunk downloads, parses and executes the mount effect — ~500ms after the HTML
was already in hand. On `/samples` this JSON gates the swap from the R493 skeleton
to the 9 real sample cards, so the delay is directly user-visible.

Source: `Dashboard.tsx` (serves `/dashboard`, `/documents`, `/samples`) fetches
`/examples/examples.json` unconditionally on mount; `Builder.tsx` does too (example
picker + `?example=` deep link). The homepage does not (Landing hardcodes slugs).

## Design

Worker-only (`worker/index.ts`): `applyRoutePreload()` already rewrites the
route-specific modulepreload per request path. Extend it to also inject

```html
<link rel="preload" href="/examples/examples.json" as="fetch" crossorigin="anonymous" />
```

before `</head>` for the four routes that fetch it on mount:
`/builder`, `/dashboard`, `/documents`, `/samples`.

`crossorigin="anonymous"` is required for the preload to match `window.fetch()`
(request mode `cors`, credentials `same-origin`); without it Chrome double-downloads
and warns "preloaded but not used".

## Non-goals

- No preload on `/`, `/jobs`, `/ats-checker`, `/s/*`, 404 (they never fetch it).
- No change to the fetch effects, the R493 skeleton, or the R494 chunk map.
- No service-worker change (`/examples/*` behavior unchanged).

## QA

- Raw HTML: preload present exactly once on the four routes, absent elsewhere.
- CDP cold `/samples`: examples.json request starts with the HTML-discovered wave
  (before the api chunk executes), exactly one download (no double-fetch warning),
  9 cards render, zero console errors/preload warnings.
- `/builder` `?example=` deep link still applies the example.
