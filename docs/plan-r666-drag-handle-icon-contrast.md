# R666 — builder drag-handle grip icons meet 3:1 non-text contrast (WCAG 1.4.11) in the light theme

## Evidence (production, index-BLTPcaBg.js, 2026-09-06)

R665 found that the R661/R662 computed contrast scanner discarded foreground alpha. R666 re-ran
the scan alpha-aware (`qa/r666-scan.cjs`, 8 routes × 1280, light) and probed the three remaining
alpha foregrounds in the repo directly (`qa/r666-alpha-probe.cjs`, light + dark):

| element | class | light | dark | verdict |
| --- | --- | --- | --- | --- |
| AtsChecker "+29 pts" delta text | `text-foreground/70` 12px | 7.07 | 7.69 | passes 4.5 |
| Jobs JD section headings ("Responsibilities") | `text-foreground/80` 12px/600 | 10.24 | 9.70 | passes 4.5 |
| Builder drag-handle `GripVertical` icon | `text-muted-foreground/60` | **2.47** | 3.08 | **fails 3:1 (light)** |

A second probe (`qa/r666-icons.cjs`) measured every icon-only control (button / role=button /
link / summary / tab / switch whose only content is an `<svg>`) on the 8 routes, light + dark:
64 icon-only controls on /builder, 10 on /dashboard, 10 on /samples, ≤1 elsewhere. The only nodes
below 3:1 are the drag handles (light theme, 3 rendered on the accountant example; education and
section-order handles share the identical class string). Dark passes at 3.08.

The handle is `<span role="button" aria-label="Drag role N to reorder">` around the grip icon —
the icon is the only visual that identifies the control, so WCAG 1.4.11 (non-text contrast, 3:1)
applies; it is an active component, not exempt. axe cannot see it: `color-contrast` only checks
text nodes, and axe has no non-text-contrast rule.

Not a gap: keyboard users have explicit Move up / Move down buttons for every reorderable row, so
the pointer-only handle (no `tabIndex`) is not the sole reorder mechanism.

## Fix (Builder.tsx, 3 identical class strings)

```diff
- className="text-muted-foreground/60 hover:text-foreground -my-2.5 -ml-1 cursor-grab touch-none p-3.5 active:cursor-grabbing sm:my-0 sm:p-1"
+ className="text-muted-foreground hover:text-foreground -my-2.5 -ml-1 cursor-grab touch-none p-3.5 active:cursor-grabbing sm:my-0 sm:p-1"
```

(and the same for the education and section-order handles). Full `--muted-foreground` measures
5.38 light / 6.77 dark on `bg-background` (R665 numbers), comfortably above 3:1 in both themes;
the neighbouring "Role N" label already uses the same token, so hierarchy is unchanged. Hover
still lifts to `text-foreground`. No geometry change (color only).

## Verification

- `npx tsc -b && npx eslint src/pages/Builder.tsx && git diff --check && npm run build && node scripts/verify-dist.mjs`
- deploy; discover bundle; `THEME=light node qa/r666-icons.cjs 1280` → 0 below 3:1 on /builder;
  `THEME=dark` unchanged 0; `qa/r666-alpha-probe.cjs` drag ratio ≥ 5 both themes; 0 console
  errors; storage restored.

## Honest limits

- Section-order handle (line ~7334) lives in the section-order dialog; verified by identical class
  string, not opened in the probe.
- No real screen-reader listening; pointer drag not exercised on a real touch device.

## Production result (index-D1HFeIO9.js)

Drag handle icon 2.47 → **5.53** light, 3.08 → **6.31** dark; `r666-icons` /builder 64 icon-only
controls @1280 and 38 @375: 0 below 3:1 in both themes; 0 console errors; storage restored.
