# R53 — Bigger hero preview + related-template thumbnails on template detail pages

## First-hand evidence (2026-08-29, ~/audit-r1/shots-r52/)

- Rezi's templates hub (`rezi-templates-hub-full.png`) presents every template
  as a large, readable full-content preview; templates are always shown
  visually, never as bare text links.
- Our template detail pages (`rezup-template-detail-full.png`, e.g.
  `/templates/classic/`): the R51 real-content preview renders at only 140px
  wide — too small to read the sample content that now exists inside it — and
  the "Other templates" section is a bare list of 21 text links with no
  visual at all, so switching templates from a detail page is blind.

Gap: **P2, landing/content dimension.**

## Design (static `/templates/<slug>/` pages only)

1. Hero preview: render `templateThumbSvg(slug, 300)` with a light border
   card so the R51 sample content is actually legible at a glance.
2. "Other templates": replace the bare `<ul>` link list with a responsive
   thumbnail grid — each entry a small real-content preview
   (`templateThumbSvg(other, '100%')`) plus the template name, linking to
   that template's detail page. Reuses the existing generator; zero JS, zero
   new dependencies, no React changes.

## Deliberately NOT copied

- Rezi's per-category curation labels and "Latest arrivals" (no data).
- Gallery-level style configurator (builder already has per-resume controls).
