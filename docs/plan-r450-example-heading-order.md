# R450: fix skipped heading level on the six /examples/<slug>/ pages

## Evidence (first-hand, production 2026-08-31)

- axe-core 4.10.2 sweep of 10 static prerendered routes: only the six
  `/examples/<slug>/` pages flag `heading-order` (moderate). All other static
  pages (`/pricing/`, `/templates/`, `/guides/`, `/cover-letter/`, …) and all
  SPA routes (desktop, 375 mobile, open-menu states) return zero violations
  after R449.
- Heading outline on each example page: `H1: <Role> resume example` is
  followed directly by `H3: Summary / Experience / Skills / Education`
  (the rendered example resume), then the page's real `H2` tip sections.
  The jump H1→H3 skips a level (WCAG 1.3.1 / axe `heading-order`).
- Source: `scripts/build-seo.mjs` `exdoc` block hardcodes `<h3>` for the four
  resume section headings; the styling selector is `.exdoc h3`.

## Fix (smallest change)

In `scripts/build-seo.mjs` only:
- change the four `<h3>` section headings inside the `exdoc` block to `<h2>`;
- change the `.exdoc h3` CSS selector to `.exdoc h2` (same declarations, so
  the visual rendering is unchanged — the heading style is fully self-managed
  by that selector: font-size .8rem, uppercase, letter-spacing, border).

Not touched: pricing FAQ / promo-page `<h3>`s (they correctly follow an
`<h2>`), template-card `<h3>`s (follow `H2: More examples`-style sections),
SPA pages, worker.

## QA (production, after deploy)

1. axe `heading-order` gone on all six `/examples/<slug>/` pages.
2. Outline is H1 → H2s (resume sections + tips) on each page.
3. Visual: section headings pixel-equivalent to before (uppercase small
   caps style), desktop + 375, light + dark.
4. Regression: /examples/ hub, R422 static skip link, other static pages
   still axe-clean.
