# R486 — offline app shell via a minimal service worker

## Evidence (first-party, production)
- R486 audit is clean elsewhere: 5 static routes × 2 viewports axe CLEAN + zero horizontal
  overflow; Lighthouse mobile — / perf 0.95 / BP 1.0 / SEO 1.0; /ats-checker, /jobs,
  /dashboard a11y 1.0 / SEO 1.0; security headers (HSTS/CSP/XCTO/XFO) all present;
  zero console errors across 5 SPA routes.
- `navigator.serviceWorker.getRegistrations()` on production → **0** registrations.
- Offline reload of /builder only worked in the probe because the HTTP disk cache still
  held the current-deploy assets; after cache eviction (or on a device that never
  revisits within TTL — SPA shells are max-age=60) a cold offline load is the browser
  error page. All user data (17 localStorage keys) lives on-device — the app being
  unavailable offline contradicts the local-first promise.
- Banked in the R478–R482 SOP-04 next-step list: “PWA 完整体验（Service Worker/离线）”.
  Maskable icons (R483), id/scope/shortcuts (R484), screenshots (R485) are done; the
  service worker is the last missing piece for a real installable PWA.

## Fix (minimal, hand-rolled runtime-caching SW — no new dependency)
- `public/sw.js`:
  - Navigations (same-origin, not `/api/*`, not `/s/*`): **network-first**, falling back
    to the cached copy of that page, then to any cached app-shell page — online users
    always get fresh HTML (deploys unaffected), offline users get the app shell and the
    SPA renders the route client-side.
  - `/assets/*` (content-hashed, immutable): **cache-first**.
  - Fonts / icons / manifest / screenshots: **stale-while-revalidate**.
  - `/api/*` and `/s/*` (no-store shared links must 404 immediately when revoked):
    untouched — network only.
  - `activate` deletes unknown cache versions; page/asset caches trimmed to a bounded
    number of entries.
- `src/main.tsx`: register `/sw.js` on window load in production builds only.
- `scripts/verify-dist.mjs`: assert `dist/client/sw.js` ships.
- CSP already allows this (`worker-src 'self'`); `/sw.js` is served with
  `max-age=60` semantics from the pages bucket so browser SW update checks see new
  versions quickly. HTML/CSP/manifest zero changes.

## Non-goals
- No precache manifest / no vite-plugin-pwa (Vite 8 rolldown compatibility risk; the
  runtime strategy needs no build-time asset list and cannot serve a stale hashed asset).
- No offline caching of `/api/*` responses, no background sync, no push.
- No install-prompt UI.

## QA (production, independent)
- SW registers, activates, controls the page.
- Offline after one visit: /builder and /dashboard navigations render the full app.
- Online navigations still hit the network first (fresh HTML after deploys).
- /s/* and /api/* bypass the SW.
- No console errors; regression: R468 Ctrl+S, R480 axe, manifest members intact.
