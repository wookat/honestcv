# R422 — Skip to content link on static prerendered pages

## Production evidence (CDP probe @1280, https://cv.zalize.com)

- R421 added the skip link to the SPA header only; the 11 static prerendered
  header templates in scripts/build-seo.mjs were banked as follow-up.
- Measured on production static pages (/about/, /templates/, /pricing/,
  /guides/ats-friendly-resume/, /examples/software-engineer/): 15 visible
  focusable elements before `<main>` on every page, zero skip links —
  same WCAG 2.4.1 "Bypass Blocks" gap the SPA had.
  (The guides page "hasSkip" probe hit was body copy containing "skip",
  not an actual skip link.)

## Scope

- scripts/build-seo.mjs only. 11 identical `<header class="site">` openings
  and 11 `<main` openings — a mechanical, uniform change.
- No SPA changes; R421 already covers app pages.

## Implementation

- Prepend `<a class="skip" href="#main">Skip to content</a>` before every
  `<header class="site">`.
- Give every `<main` an `id="main" tabindex="-1"` so the native fragment
  navigation lands focus on main — no JS needed on static pages.
- CSS: `.skip` absolutely positioned off-screen; on `:focus` it appears
  top-left as a bordered card (mirrors the SPA link's revealed style).

## Validation

- Local: build, then grep dist static HTML for the link + id on all pages.
- Production: first Tab on several static pages reveals the link; Enter
  moves focus to `<main>`; invisible without keyboard focus in light/dark;
  no layout shift; nav/CTA unaffected.
