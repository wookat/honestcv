# R309 — Lighthouse-verified fixes: /jobs CLS + per-route SPA canonical

## First-party evidence (direct measurement, Lighthouse 12 on production)

Lighthouse runs against live cv.zalize.com (mobile emulation, bundle
`index-CSemBJ9E.js`):

- `/` performance 0.91, a11y/best-practices/SEO 1.0 — healthy.
- `/jobs` performance 0.69 with **CLS 0.289 (poor, threshold 0.25)**. The
  layout-shift culprit is the results container (`max-h-[70vh]` card): while
  `/api/jobs` loads it renders a single `<p>Loading jobs…</p>` line, then the
  full list lands and pushes everything below (facets footer) down by ~550px.
- `/builder`, `/jobs`, `/dashboard` all fail the `canonical` SEO audit:
  the SPA shell (`index.html`) hardcodes
  `<link rel="canonical" href="https://cv.zalize.com/" />`, so every SPA route
  declares the homepage as its canonical ("Points to the domain's root URL,
  instead of an equivalent page of content").

Rezi benchmark: their app/marketing pages carry per-page canonicals (verified
in R306/R307 work); Core Web Vitals thresholds are Google's own (CLS < 0.1
good, > 0.25 poor).

## Design (narrow)

1. **/jobs skeleton rows (CLS)** — while `loading`, render 6 pulsing
   placeholder rows (logo square + two text bars, roughly one job row tall)
   inside the same results card instead of the one-line paragraph. The card
   then occupies its post-load height class from first paint, so the arrival
   of real rows no longer shifts the page. `aria-busy` + a visually-hidden
   "Loading jobs…" keeps the a11y announcement.
2. **Per-route canonical** — new `CanonicalSync` component in `App.tsx`
   (inside the router): `useLocation()` effect sets the existing
   `link[rel=canonical]` href to `https://cv.zalize.com` + pathname. Static
   SEO pages (build-seo.mjs) already emit their own slashed canonicals and
   don't run the SPA, so they are unaffected.

Zero worker/schema/storage changes; no behavior change to job filtering.

## Verification

- `npx tsc -b`, changed-file ESLint, `npm run build`.
- Deploy, then Lighthouse re-run on /jobs (CLS < 0.1) and canonical audit
  passing on /builder, /jobs, /dashboard.
- Testing-agent production QA: skeleton appearance/disappearance, no
  regression to list rendering, canonical href per route (DOM), 375px strict
  width, dark mode, zero AI calls, state restoration.
