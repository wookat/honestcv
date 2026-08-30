# R56 — Multi-column footer sitemap across React and static pages

## Evidence (first-hand, 2026-08-29, ~/audit-r1/shots-r56/)

- Rezi (`rezi-home-full.png`, `rezi-pricing-full.png`): every marketing page ends in a
  five-column footer sitemap (Product / Resume Guides / AI Career Tools / Resources /
  Company) — dozens of internal links that both aid navigation and concentrate internal
  linking for SEO.
- RezUp (`rezup-home-full.png`, `rezup-pricing-full.png`): the footer is three centered
  lines of inline text links (~14 links crammed into one paragraph). On the static side,
  `scripts/build-seo.mjs` repeats nine near-identical one-line `<footer>` literals — some
  omit Terms/Privacy entirely (the comparison-page variant has no legal links at all).

Gap class: 落地页/信息架构 P2 — every high-traffic page ends in a wall-of-text footer, and
several static page types drop legal links.

## Decision

Replace both footers with the same four-column sitemap (plus a bottom line for the
copyright/e-privacy promise and Zalize sister tools):

- **Product**: Resume builder, My resumes, Job search, Free ATS checker, Pricing
- **Resources**: Resume templates, Resume examples, Resume guides, All comparisons (/vs/)
- **Compare**: RezUp vs Zety, vs LiveCareer, vs Rezi, vs Enhancv, One-time payment builders
- **Company**: About, Terms & refunds, Privacy, Contact

Implementation:

1. `scripts/build-seo.mjs`: single `siteFooter()` helper replaces all nine `<footer>`
   literals; column styles added to the shared `CSS` constant. Zero JS, no-JS friendly.
2. `src/components/Layout.tsx`: `SiteFooter` rewritten to the same four-column grid
   (2 columns at 375px, 4 at md+), keeping the beta/one-time-pricing and browser-local
   promise lines.

Deliberately not copied: Rezi's 40+-link five-column footer with per-article blog links
(we link the hubs, which have R50/R54 search), and their app-store/social icon rows (no
apps, no active social accounts — links would be fake).

## Validation

- Local: `npm run lint`, `npx tsc -b`, `npm run build` (regenerates all static pages).
- Production QA at 1440px and 375px on `/` (React) and `/guides/` + `/vs/zety` (static):
  four columns render, links resolve 200, 2-column collapse on mobile, no horizontal
  overflow, console clean.
