# R315 — Fix Lighthouse font-size best-practices failure on resume thumbnails

## Evidence

- R310 production Lighthouse runs left `/dashboard` and `/samples` at best-practices 0.96;
  the only failing audit is `font-size`: the `Thumb` mini resume previews render real
  `ResumePreview` markup shrunk with `zoom: 0.35` (Dashboard.tsx `Thumb`), so every text
  node's *computed* font-size lands well below the 12px legibility threshold
  (e.g. 14px × 0.35 ≈ 4.9px). Lighthouse/axe measure computed size, and `zoom`
  participates in computed style — `transform: scale()` does not.
- Rezi's dashboard shows comparable resume-card thumbnails without failing this audit.

## Design

Keep the identical visual (a 35%-size live preview) but make the computed font sizes
truthful:

```diff
-<div className="absolute inset-x-4 top-3 origin-top" style={{ zoom: 0.35 }}>
+<div
+  className="absolute top-3 left-4 origin-top-left"
+  style={{ width: 'calc((100% - 2rem) / 0.35)', transform: 'scale(0.35)' }}
+>
```

- `transform: scale(0.35)` shrinks the render without touching computed font-size, so
  the audit passes and the text remains exactly as legible as before (thumbnail is
  `aria-hidden` decoration; the accessible name lives in the sr-only span from R310).
- `zoom` lays content out at `container / zoom` width; to preserve the identical layout
  the scaled inner div gets `width = (100% − 2rem horizontal inset) / 0.35` and
  `transform-origin: top left`.
- One component (`Thumb` in Dashboard.tsx) — used by saved-copy cards, the draft card,
  and sample cards on /dashboard and /samples. No other zoom usages exist in src/.

## Verification matrix

1. Lighthouse best-practices on /dashboard and /samples: `font-size` audit passes,
   BP score 1.0 (was 0.96).
2. Visual parity: thumbnails render the same content at the same size (screenshot vs
   pre-change production), no clipping/overflow inside the h-44 card.
3. Computed font-size of thumbnail text nodes ≥ 12px (CDP getComputedStyle).
4. Card interactions regression: preview dialog opens from thumbnail button, star
   save toggle, Use this example.
5. 375px strict scrollWidth = 375 on /dashboard and /samples; dark mode renders.
6. Zero real AI calls; restore localStorage/theme baseline.
