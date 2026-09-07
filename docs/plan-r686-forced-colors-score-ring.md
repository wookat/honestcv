# R686 — ScoreRing track invisible under forced-colors (arc floats on nothing)

## Evidence (production, index-pR3LCzHj.js, `qa/r686-evidence.cjs 1280`)

`ScoreRing` (AtsChecker result, landing showcase ×2, builder score) draws an SVG track circle `stroke="currentColor" class="text-muted"` and an arc circle `stroke={authorColor}`.

| element | normal                          | forced-colors (CDP, dark palette)                 |
| ------- | ------------------------------- | ------------------------------------------------- |
| track   | `oklch(0.96 0.01 260)` (muted) | `oklch(0.26 0.02 260)` — `--muted` token, ~1.6:1 on Canvas |
| arc     | `#d97706` / emerald             | unchanged (SVG `stroke` presentation attribute is **not** forced) |
| number  | author colour (inline style)    | CanvasText                                        |

- Track is the `--muted` token in both modes, so under forced-colors it is near-Canvas (dark grey on black here; would be `oklch(0.96)` on a white HC canvas — ~1.1:1). The "out of 100" remainder of the gauge disappears; only a floating arc is left (`qa/shots/r686/01-ring-atschecker-forced-1280-1280.png`).
- Arc keeps its author colour because Chrome does not force SVG `stroke`; distinct from the track, but the track itself fails 1.4.11 (3:1) against Canvas.
- Number is CanvasText (already fine).

## Fix (mirrors R684 meter bars: CanvasText frame + Highlight fill)

```tsx
<circle … stroke="currentColor" className="text-muted forced-colors:stroke-[CanvasText]" />
<circle … stroke={color} className="forced-colors:stroke-[Highlight]" />
```

- CSS `stroke` overrides the presentation attribute only inside `@media (forced-colors: active)`; normal mode is byte-identical.
- Track becomes a full CanvasText ring, arc becomes Highlight (system pair guaranteed distinct from CanvasText and Canvas in every Windows theme). Number remains CanvasText.
- No `forced-color-adjust` needed — `stroke` is not a forced property.

## Verify

- `qa/r686-evidence.cjs 1280|375` forced: track `rgb(255,255,255)`, arc `rgba(0,230,255,0.8)`; normal unchanged (track `oklch(0.96 0.01 260)`, arc author colour, dashoffset unchanged).
- Builder ring (needs a resume): same classes, verified by class presence in the bundle.
- Regressions: `r684-evidence.cjs` (bars), `r678-forced.cjs`; console 0; storage restored.

## Limits

CDP `forced-colors` emulation only — real Windows High Contrast not run.
