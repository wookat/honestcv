# R689 — builder bullet textareas: the hovered/focused guidance-line highlight is painted over the text and drops it to 2.8–3.5:1

## Evidence (`qa/r689-evidence.cjs 1280 dark|light [proto]`, production `index-BXnG3COl.js`, `/builder?example=accountant`)

`BulletGuidance` sets `highlightLine` while a "⚠ Line N" row is hovered or its "Fix line N with AI" button is focused (keyboard users hit this on every Tab through the list). `LintedTextarea` then paints `bg-amber-200/60` on the mirror span for that line. The mirror sits **on top of** the `<textarea>`, so the wash covers the glyphs, not just the background.

Rendered pixels of the highlighted line (dominant background / text colour of the clip, WCAG ratio):

| theme | at rest                          | hovered (production)          | prototype `mix-blend-mode` |
| ----- | -------------------------------- | ----------------------------- | -------------------------- |
| light | `#fff` / `rgb(12,18,27)` = 18.78 | `rgb(254,240,182)` / `rgb(156,145,90)` = **2.78** | `multiply`: `rgb(254,240,182)` / `rgb(12,17,20)` = 16.60 |
| dark  | `rgb(18,22,29)` / `rgb(228,232,239)` = 14.75 | `rgb(65,47,11)` / `rgb(149,132,96)` = **3.51** | `screen`: `rgb(72,58,29)` / `rgb(234,236,239)` = 9.35 |

Screenshots: `qa/shots/r689/hl-light-1280.png`, `hl-dark-1280.png` (text turns muted amber-on-amber) vs `hl-*-1280-proto.png` (same wash, text keeps its colour). 14px normal text → WCAG 1.4.3 needs 4.5:1; the hover/focus state fails in both themes. axe never sees it: the state only exists while hovering, and the wash is on an `aria-hidden` element axe does not pair with the textarea text.

Why the dark value is not `amber-200`: `src/index.css` remaps `--color-amber-200` to `oklch(0.4 0.09 80)` under `.dark` (R661 palette), so the wash is a dark amber that pulls white text down.

## Fix (`src/components/LintedTextarea.tsx` only)

Blend the highlight with what is beneath it instead of covering it:

```tsx
i === highlightLine &&
  'rounded-sm bg-amber-200/60 mix-blend-multiply dark:mix-blend-screen forced-colors:bg-transparent …'
```

- light: `multiply` keeps white → amber-200 and dark text → darker; the wash looks the same, the text does not lighten.
- dark: `screen` keeps the near-black field → lighter amber-brown and white text → white.
- forced-colors: unchanged (R688 already swaps the wash for a `Highlight` outline; `mix-blend-mode` on a transparent background is a no-op).

No layout, ARIA or normal-state change; the highlight is still the same colour token, only the compositing changes.

## Verification

- Local: tsc / eslint / build / verify-dist.
- Production 1280 + 375 × light/dark: pixel contrast of the hovered line ≥ 4.5 (expected ≈16.6 / ≈9.4), rest state unchanged (18.78 / 14.75), highlight still visible (background differs from rest); focus-triggered highlight (Tab to "Fix line N with AI") produces the same pixels; R688 checks (`qa/r688-verify.cjs`) unchanged; zero console errors; storage restored.

## Not verified

Real Windows High Contrast (forced-colors path is unchanged from R688 and only CDP-emulated); Safari/Firefox blend-mode rendering (Chrome only).
