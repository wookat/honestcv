# R683 — static (prerendered SEO) page `.btn` CTAs get a 1px frame under forced-colors

Chains after R679 (#900), which framed the SPA `Button` variants. Same defect, other renderer.

## Evidence (production, CDP `forced-colors: active`, `qa/r683-evidence.cjs 1280`)

The 120 prerendered pages (`scripts/build-seo.mjs`) do not use the SPA `Button`; their CTAs are
`<a class="btn">` styled by an inline `<style>` block:

```css
.btn{…;background:var(--primary);color:var(--primary-fg);…;border:0;…}
```

Under forced-colors the background is forced to `Canvas`, the text to `LinkText`, and `border:0`
leaves nothing else — the primary CTA on every static page is bare yellow text
(`qa/shots/r683/01-static-btn-pricing-1280.png`):

| page | `a.btn` | border-width | background | color |
| --- | --- | --- | --- | --- |
| /pricing | 4 | 0px | rgb(0,0,0) | rgb(255,255,0) |
| /templates/ | 3 (2 primary + "Check my ATS score") | 0px / 0px / **1px** | | |
| /examples/ | 3 | 0px / 0px / **1px** | | |

The one that keeps a frame is the secondary CTA with an inline `border:1px solid var(--border)`, so
the same inverted hierarchy as R679 appears: the secondary action looks like a button, the primary
one does not. 23 `class="btn"` call sites in build-seo.mjs, 120 pages.

Checked and not a gap on the same run: `ScoreRing` (SVG strokes are not forced; ring 86/72/75 arc
visible, number `rgb(255,255,255)`); static `<a>` focus uses the UA outline (no `outline:none` on
links). Found and deferred to R684: builder Health dialog `role=progressbar` track and fill both
render `rgb(0,0,0)` — 7 bars invisible (`qa/shots/r683/05-builder-progress-1280.png`).

## Design

One rule in the shared static CSS string, next to `.btn`:

```css
@media (forced-colors:active){.btn{border:1px solid}}
```

- Colour is left to the system palette (forced to `CanvasText`/`LinkText` by the UA), exactly like
  R679's `forced-colors:border` on the SPA `Button`.
- Media query → zero bytes change in normal rendering; the 44px min-height already absorbs the 2px.
- The inline-styled secondary CTA already has `border:1px solid`; the rule is a no-op for it.

## Verification

- `npm run build` regenerates the 120 pages; `verify-dist` OK.
- Production `qa/r683-evidence.cjs 1280` / `375`: every `a.btn` `border-width: 1px` on /pricing,
  /templates/, /examples/; screenshot shows the frame.
- Normal mode `qa/r683-normal.cjs`: `.btn` border-width `0px`, background `var(--primary)` resolved,
  box height unchanged (44px) at 1280 and 375.
- Regressions: `r678-forced.cjs` (/pricing focus outlines), `r681-proof.cjs` /pricing route (static
  pages had 0 frameless text buttons; must stay 0).

## Not verified

Real Windows High Contrast (CDP emulation only). The other 117 static pages share the same CSS
string and `.btn` markup; measured on the three routes above plus the build output grep.
