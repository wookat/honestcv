# R684 — meter bars (Health progressbars, resume-length meter, landing breakdown) are invisible under forced-colors

Chain: R678 focus → R679 Button frames → R680 selected state → R681 link-styled buttons → R682 colour
swatches → R683 static `.btn` → **R684 meter bars**.

## Evidence (production, CDP `forced-colors: active`, `qa/r684-evidence.cjs 1280` / `375`)

Three places draw a value as a thin bar (`h-1.5` track `bg-muted`, fill `bg-emerald-500 / bg-amber-500 /
bg-red-400`, width `${score}%`):

| surface | markup | 1280 measured (before) |
| --- | --- | --- |
| builder Health dialog, 7 dimensions | `role="progressbar" aria-valuenow` | track `rgb(0,0,0)`, fill `rgb(0,0,0)`, border `0px` — `distinct:false` ×7 |
| builder preview "Resume fills N% of the first page" | `role="img" aria-label` | track `rgb(0,0,0)`, fill `rgb(0,0,0)`, 64×6 — `distinct:false` |
| landing "Score breakdown" showcase, 3 rows | `aria-hidden` (R663 precedent: decorative-but-read) | track/fill both `rgb(0,0,0)` ×3 |

Same at 375 (Health dialog opened via "See full score breakdown" in the Preview pane). Screenshot
`qa/shots/r684/03-health-bars-forced-1280-1280.png`: label + number visible, the bar row is empty black.
Under forced-colors the UA drops author `background-color` (forced to `Canvas`), so track and fill collapse
into the page background; there is no border to fall back on. The numeric score next to each bar survives,
so the *information* is not lost — but the bar is a WCAG 1.4.11 non-text component that currently renders
as nothing, and the length meter's percentage is only in `aria-label` (the visible text says "fits on one
page", not the %).

Ruled out on the same run: `ScoreRing` / strength gauge are SVG strokes and stay visible (R683).

## Design

Mirror what native Windows progress bars do in High Contrast: a `CanvasText` frame with a `Highlight`
fill. Apply only under `forced-colors:` so normal light/dark rendering is byte-identical:

```tsx
// track
className="bg-muted … forced-colors:border forced-colors:border-[CanvasText]"
// fill
className="h-full rounded-full bg-emerald-500 … forced-colors:bg-[Highlight] forced-colors:[forced-color-adjust:none]"
```

- `forced-color-adjust: none` is scoped to the fill only (same rule as R682: only the element whose
  colour *is* the content opts out), so the track keeps system colours and the frame is system `CanvasText`.
- `Highlight` is a system colour, so it follows the user's theme (not a hard-coded author colour).
- 1px border on a 6px track leaves a 4px fill — measured in the prototype as visible at both viewports.
- R680's global `[aria-pressed]/[aria-current]/[aria-selected]` rule doesn't touch these elements.

Prototype (`r684-evidence.cjs 1280 proto` / `375 proto`, same CSS injected as plain rules): all 11 bars
`trackBorder 1px CanvasText`, `fillBg Highlight`, `distinct:true`; screenshot
`03-health-bars-proto-1280-1280.png` shows the bar.

## Scope

- `src/pages/Builder.tsx` — Health dialog progressbar track/fill (1 site), preview length meter track/fill (1 site).
- `src/pages/Landing.tsx` — showcase "Score breakdown" track/fill (1 site).
- No markup, ARIA, colour-threshold or normal-mode change.

## Verification

1. `npx tsc -b --noEmit`, `npx eslint src`, `git diff --check`, `npm run build`, `npm run verify-dist`;
   confirm the compiled CSS contains `forced-colors` rules for `border-[CanvasText]` and `bg-[Highlight]`.
2. Deploy; confirm the served bundle name changed.
3. `r684-evidence.cjs 1280` and `375`: all bars `distinct:true`, `trackBorder 1px`, fill `Highlight`.
4. `r684-evidence.cjs 1280 normal` / `375 normal` before vs after: identical (border 0px, author colours,
   widths/heights unchanged).
5. Regressions: `r678-forced.cjs`, `r680-state.cjs`, `r682-evidence.cjs` (builder), console 0, storage
   back to baseline.

## Limitations

CDP forced-colors emulation only (emulated palette: `Highlight` = cyan, `CanvasText` = white); real
Windows High Contrast not tested. The landing rows stay `aria-hidden` (they are a mock, as in R663).
