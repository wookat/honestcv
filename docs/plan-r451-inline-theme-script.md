# R451: inline the pre-paint theme script (kill the last render-blocking request)

## Evidence (first-hand, production 2026-08-31)

- Lighthouse 12 (emulated mobile) on `https://cv.zalize.com/`: performance 88,
  best-practices 100, SEO 100. The render-blocking insight lists exactly two
  resources: the hashed app CSS (165 ms, necessary) and `/theme.js`
  (1.2 KB, **465 ms wasted** — the single biggest render-blocking item).
- `/theme.js` also has only a 60 s cache lifetime (it is un-hashed, so the
  worker's default page cache applies), so repeat visits re-fetch it.
- The script exists solely to apply the stored color-scheme class before first
  paint (FOUC guard). It was made an external file because the CSP is
  `script-src 'self'` with no inline scripts allowed.

## Fix (smallest change, no security weakening)

Inline the (minified, single-line) theme snippet directly into the `<head>` of
the SPA shell (`index.html`) and every static page (`scripts/build-seo.mjs`
`THEME_SCRIPT`), and allow exactly that one script via a CSP sha256 hash:

- `worker/index.ts`: `script-src 'self' 'sha256-<hash-of-snippet>'` — hash
  allowances are as strict as `'self'`-only: only this exact byte sequence may
  run inline; any other inline script is still blocked.
- Delete `public/theme.js` (no longer referenced anywhere).
- Drift guard: `scripts/build-seo.mjs` (runs on every build) computes the
  sha256 of its own `THEME_INLINE` constant and asserts (a) `index.html`
  contains the identical inline tag and (b) `worker/index.ts` carries the
  matching `'sha256-…'` token — the build fails if any copy drifts.

Out of scope: `/t.js` (deferred, not render-blocking), `hub-filter.js`
(deferred, one page), unused-JS in the main bundle (code-split follow-up
candidate), font/cache lifetimes.

## QA

- Local: tsc/eslint/build green; dist HTML contains the inline tag; drift
  assertion trips when tampered (verified once, then reverted).
- Production: no `/theme.js` request on any page; dark preference still applies
  before first paint on SPA + static pages (no flash); no CSP violations in the
  console anywhere (Builder, jobs, static pages); Lighthouse render-blocking
  insight no longer lists theme.js; R449/R450 regressions.
