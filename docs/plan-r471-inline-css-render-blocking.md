# R471 — inline the stylesheet into the prerendered homepage and SPA shell

## Evidence (first-hand, production, post-R470)

- Lighthouse mobile (`~/audit-r1/r470_after.json`): perf 0.90; LCP 2.9 s with
  TTFB 47 ms and element render delay now down to 281 ms — the remaining LCP
  cost is FCP itself (2.55 s).
- `render-blocking-insight` score 0: the only render-blocking request on the
  page is `/assets/index-*.css` (~15 KB transferred/gzipped, 75 KB raw), estimated
  savings ~150–165 ms. Under Lighthouse's simulated 4G this is a full extra
  round trip between HTML arrival and first paint.
- The ~120 static SEO pages built by `scripts/build-seo.mjs` already inline
  their own CSS (`<style>${CSS}</style>`) — they have no render-blocking
  stylesheet. Only the two shells written by `scripts/prerender.mjs`
  (`index.html` — the prerendered homepage — and `spa.html` — every SPA route)
  still load the Vite stylesheet via a blocking `<link>`.
- The build emits exactly one CSS asset. No JS chunk references the CSS file
  (verified by grepping `dist/client/assets/*.js` for the hashed name); it is
  only referenced from the shell `<link>` tag.
- CSP already allows inline styles (`style-src 'self' 'unsafe-inline'`), and
  all `url()` references in the CSS are root-absolute (`/fonts/...`), so
  inlining does not break font resolution or CSP.

## Change

`scripts/prerender.mjs` only:

- Locate the single `index-*.css` asset in `dist/client/assets` and the
  `<link rel="stylesheet" ...>` tag in the shell; fail the build loudly if
  either is missing, if there is more than one stylesheet link, or if the CSS
  contains `</style` (inline-safety guard).
- Replace the link tag with `<style>…full CSS…</style>` in both the
  prerendered `index.html` and `spa.html`.
- Keep the hashed CSS asset on disk (harmless; nothing references it).

`vite.config.ts` (follow-up after production QA):

- `build.cssCodeSplit: false` — production QA found that with the default
  code-split CSS, Vite's preload helper listed the hashed stylesheet as a
  dependency of the dynamically imported route chunks and re-fetched the same
  ~75 KB after paint on /builder. With splitting off, the single stylesheet
  (`style-*.css`) is referenced only by the HTML shells, which inline it —
  a cold load of any route makes zero `.css` network requests.

## Trade-offs (considered honestly)

- +75 KB raw / ~+14 KB gzipped per HTML document (homepage ~19 KB → ~33 KB
  gzipped; spa.html ~15 KB gzipped total). The bytes were being downloaded
  anyway before first paint — inlining moves them into the HTML stream and
  removes the extra request/round trip; the external file's immutable cache is
  lost, but SPA navigations are client-side (one document per visit) and the
  static SEO pages never used this file. Post-deploy Lighthouse will confirm
  the net effect; revert if it regresses.
- SPA navigations load one document, so nothing is paid twice. Static SEO
  pages already inline CSS, so cross-page CSS caching was never in play there.

## Non-goals

- No change to `build-seo.mjs` static pages (already inline).
- No font cache-header change (7-day TTL on unhashed files is a deliberate
  freshness/immutability trade-off; banked as a possible future round).
- No change to app CSS content, themes, or fonts.

## QA matrix

- verify-dist gate passes; homepage + a SPA route render identically
  (light/dark, desktop/375) with zero console errors.
- Raw HTML of `/` and a SPA route contains the inlined `<style>` and no
  `<link rel="stylesheet">`; no request for `/assets/index-*.css` on load.
- Static page (e.g. /pricing/) unchanged; Lighthouse re-run after deploy.
