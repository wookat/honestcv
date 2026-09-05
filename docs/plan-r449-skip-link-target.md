# R449: give the SPA skip link a real #main target

## Evidence (first-hand, production 2026-08-31)

- axe-core 4.10.2 run against 8 production routes flags `skip-link`
  (moderate) on every SPA route that renders the shared header
  (`/`, `/dashboard`, `/documents`, `/jobs`, `/ats-checker`, `/samples`);
  `/builder` and `/interview-prep` scans returned no violations only because
  the first-run dialog / static page altered what axe saw.
- CDP probe: `document.querySelector('#main')` → null on `/` and `/jobs`;
  the only hash link on the page is `href="#main"` ("Skip to content").
- Source: the R421 skip link in `src/components/Layout.tsx` relies entirely
  on a JS `onClick` that `preventDefault()`s and focuses `<main>`; no SPA
  page gives its `<main>` an `id`. The 120 static prerendered pages (R422)
  already ship `<main id="main" tabindex="-1">`.

## Why it matters

- The link's `href` is dishonest: without JS (or if the handler ever fails)
  fragment navigation does nothing, and axe reports the WCAG 2.4.1 bypass
  mechanism as broken on every SPA route.
- Investigated and rejected candidates this round (documented for the record):
  - Builder first-run dialog missing `aria-modal`: Radix 1.1.23 deliberately
    omits it and instead applies `aria-hidden` to all siblings via
    `hideOthers` (verified 65 hidden elements on production) — not a defect.
  - Worker page `Cache-Control` seemingly missing on `/builder`: artifact of
    probing with HEAD (`curl -I`); GET responses carry
    `public, max-age=60, s-maxage=60` as designed — not a defect.

## Fix (minimal)

Add `id="main"` + `tabIndex={-1}` to the `<main>` element of all 7 SPA pages
(Builder, Dashboard, Jobs, AtsChecker, Landing, SharedResume, NotFound),
matching the static-page pattern from R422. The Layout skip-link `onClick`
behavior is unchanged; the id makes the `href` honest, satisfies axe's
`skip-link` rule, and provides a native no-JS fallback.

## QA focus

- axe `skip-link` violation gone on all SPA routes.
- Skip link still works: Tab → visible, Enter → focus lands on `<main>`.
- R421/R422 regression: static pages unchanged; SPA visual unchanged.
