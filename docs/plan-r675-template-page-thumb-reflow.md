# R675 — /templates/<slug>/ pages: hero thumbnail forces page-level horizontal scroll at 320px (WCAG 1.4.10)

## Evidence (production, 2026-09-06, bundle era index-DeqeoDPH.js)

Sweep of all 120 sitemap URLs (`qa/r675-static-sweep.cjs`) at 320px (default typography)
and 375px (with the WCAG 1.4.12 text-spacing override):

- 375px + text spacing: 0 / 120 pages overflow.
- 320px default: **25 / 120** pages overflow — exactly the 25 `/templates/<slug>/` pages,
  each `scrollWidth 316 / clientWidth 305` (scrollbar-inclusive 320 viewport).
- Root cause (`qa/r675-tpl.cjs`, `/templates/classic/`): the hero preview is
  `templateThumbSvg(slug, 300)` → `<svg width="300" …>` inside `main` whose content box is
  273px wide at 320px. The SVG is a fixed-width replaced box, so it sticks out 11px past the
  viewport and the whole page gains a horizontal scrollbar. All other static routes
  (guides, examples, vs, cover-letter/resignation pages) already reflow.

WCAG 1.4.10 Reflow requires no two-dimensional scrolling at 320 CSS px for content that
does not need it; a decorative-schematic preview does not.

## Non-goals
- The 56px / 72px thumbnails in `/templates/` and `/examples/` lists (already fit).
- The React `TemplateThumb` component (not involved in prerendered pages).

## Fix (scripts/build-seo.mjs)
Let the hero SVG shrink with the column while keeping its 300px cap:

```diff
-<div style="margin:1rem 0">${templateThumbSvg(p.path.split('/').pop(), 300)}</div>
+<div class="tpl-hero">${templateThumbSvg(p.path.split('/').pop(), 300)}</div>
+.tpl-hero{margin:1rem 0}
+.tpl-hero svg{max-width:100%;height:auto}
```

`height:auto` with the `viewBox` keeps the aspect ratio when the width is clamped. At ≥ 332px
(300 + 2×16 padding) the rendered size is identical to today.

## Verification
- `npm run build` + `node scripts/verify-dist.mjs`; deploy.
- Re-run `qa/r675-static-sweep.cjs`: expect 0 / 120 overflow at 320 and at 375+spacing.
- `/templates/classic/` at 375 / 1280: hero SVG rect equals the pre-fix width (300) and height.
- Console errors 0; storage keys unchanged.
