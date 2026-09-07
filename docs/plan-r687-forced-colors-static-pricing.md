# R687 — static /pricing under forced-colors: "Best value" pill and the recommended column vanish

## Evidence (production, `qa/r687-pricing.cjs 1280`, CDP `forced-colors: active`)

`/pricing/` is one of the prerendered SEO pages (`scripts/build-seo.mjs` → `pricingPage()`), not the SPA Landing pricing section, so none of the R679–R686 Tailwind work applies to it.

| element | normal | forced-colors |
| --- | --- | --- |
| "One-time" pill (Single Resume card) | `border:1px solid var(--border)`, transparent bg | border → CanvasText: still a pill |
| "Best value" pill (Career Bundle card) | `background:#047857; color:#fff`, **no border** | bg → Canvas, text → CanvasText: **bare text**, sitting where a pill was |
| plan table, Career Bundle column (`td:nth-child(4)`) | `background: oklch(0.5 0.18 265 / 0.06)`, `color:#047857`, `font-weight:500` | bg → `rgba(0,0,0,0.06)` (Chrome keeps the alpha, forces the colour to Canvas → invisible on Canvas), colour → CanvasText; only weight 500 vs 400 survives, and ✓ / — cells are identical to their neighbours |
| comparison table, RezUp column (`td:nth-child(2)`) | same tint + green + 500 | same loss |

The SPA Landing versions of the same UI are fine: the `Badge` component carries a `border` class (transparent → CanvasText), and the RezUp column has a `BadgeCheck` icon as a non-colour cue. Only the static page conveys "this is the recommended plan / our column" by tint and hue alone.

Screenshots: `qa/shots/r687p/01-pricing-forced-1280-1280.png`, `02-pricing-table-forced-1280-1280.png`; prototype `*-proto-*`.

## Fix (`scripts/build-seo.mjs`, `pricingPage()` only)

- "Best value" span: `border:1px solid transparent` with padding reduced by 1px on each side, so the normal geometry is unchanged and forced-colors turns the transparent border into a CanvasText frame — the same mechanism the `Badge` component already relies on.
- Highlighted columns: inside `@media (forced-colors:active)` give the tinted `th`/`td` a 1px left/right border (and un-tint the Free column of the plans table, which the base rule already resets). The column reads as a framed band instead of a tint. Normal mode: no change (rule is media-scoped).

No change to the SPA, tokens or other static pages (`.btn` frames stay from R683).

## Verification

- Local: `npm run build` regenerates `dist/client/pricing/index.html`; grep for the new rule.
- Production, 1280 + 375: pill has `1px solid rgb(255,255,255)` border under forced-colors with the same rect as before; highlighted cells have `border-left/right 1px solid`; normal mode measurements identical to the pre-change run (pill rect, cell bg/colour/weight).
- Regression: R683 `.btn` frame still present on the same page; zero console errors.

## Not verified

Real Windows High Contrast (CDP emulation only; Highlight/CanvasText palette is Chrome's simulated one).
