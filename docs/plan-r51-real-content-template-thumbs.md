# R51 — Real-content template previews

## First-hand evidence (2026-08-29, ~/audit-r1/shots-r51/)

- Rezi's templates page (`rezi.ai/resume-templates`, `rezi-templates-full.png`):
  every template is shown as a **full, realistic resume preview** — a real name,
  real section headings, real bullet text rendered in the template's actual
  typography and accent color. The page also has a live style configurator
  (color swatches, font dropdown, dividers/indent toggles) applied to the
  previews.
- Our `/templates/` hub and template detail pages (`rezup-templates-full.png`)
  plus the landing gallery and builder picker: every template is an **abstract
  grey-bar schematic** (`templateThumbSvg` in `scripts/build-seo.mjs`,
  `TemplateThumb.tsx` in React). A visitor cannot judge what a template
  actually looks like without opening the builder and switching to it.

Gap: **P2, landing/content dimension.** The schematic thumbnails communicate
layout shape but not typography, hierarchy or realism — the single biggest
visual-quality difference between the two template galleries.

## Decision

Replace the grey-bar schematics with **real-content mini previews**: a small
sample resume fragment (name, role headline, Summary/Experience/Skills
headings, a real quantified bullet) rendered as SVG `<text>` in each
template's actual style (serif/sans, accent color, divider, band, header
alignment, name case).

- One shared sample snippet (Jordan Reyes — the same persona used across QA
  seeds), so previews differ only by template style, exactly like Rezi.
- `scripts/build-seo.mjs` `templateThumbSvg()` rewritten to emit text-based
  SVG — automatically upgrades the `/templates/` hub grid, the 22 template
  detail pages, and the `/examples/` list thumbnails.
- `TemplateThumb.tsx` rewritten with the same content (JSX, styled via the
  existing `TemplateMeta`) — upgrades the landing gallery and the builder's
  template picker.
- SVG text scales cleanly at any render size; no images, no new deps, no JS.

## Deliberately not copied

- Rezi's gallery-level style configurator (color/font/divider toggles applied
  to all previews at once) — our builder already has per-resume font, spacing
  and divider controls; duplicating them as a gallery toy adds no honest value
  at 22 templates.
- Fake "Latest arrivals"/"Recruiter favorites" curation labels — no data.

## Verification

- Local: lint, tsc, build; built pages contain text-based SVGs.
- Production: 1440+375 on `/`, `/templates/`, one detail page, `/examples/`,
  builder picker; previews legible, styles visibly differ per template, no
  overflow, console clean.
