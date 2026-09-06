# R667 — keyboard focus rings meet 3:1 (WCAG 1.4.11 focus state) in both themes

## Evidence (production, index-D1HFeIO9.js, 2026-09-06)

R667 started as a sweep of the remaining non-text candidates (`qa/r667-graphics.cjs`: informative
SVGs, progress/meter fills, input borders, checkbox/radio/switch indicators — 8 routes × 1280,
light: 0 below 3:1) and of keyboard focus indicators (`qa/r667-focus.cjs`: Tab through every
tabbable on /dashboard and /builder, group by focus style). The first focus pass reported 0 weak
indicators — because the compositing helper NaN'd on an alpha-less background and the null ratio
was silently treated as a pass. With the helper fixed, **all 106 tabbables on /dashboard and 275 on
/builder fell below 3:1 in the light theme (computed 2.24–2.27)**.

Computed numbers were then confirmed with pixel sampling of the rendered focus ring (screenshot
clip → `sharp` raw pixels, `qa/r667-focus-pixels*.cjs`, `:focus-visible` true, keyboard Tab):

| control (focused via Tab) | indicator | light vs bg | dark vs bg |
| --- | --- | --- | --- |
| nav link "Templates" (browser `outline: auto` + `outline-ring/50`) | 1px auto ring | **2.89** | 19.5 (Chrome paints auto ring white) |
| dashboard search input / builder input / textarea (`focus-visible:ring-ring/50` ×3px) | box-shadow ring | **2.24–2.30** | **2.47–2.48** |
| outline button "Copies" / card button "Start a new resume" (`focus-visible:ring-ring/50` ×2px) | box-shadow ring | **2.21–2.61** | **2.48** |
| primary button "Open editor" | ring blends into `bg-primary`; outer edge vs page bg | 6.1 (button fill) | 6.6 |
| resume preview inline textbox (`focus:bg-sky-100/70 focus:ring-1 focus:ring-sky-300`, white paper) | 1px ring + tint | **1.6 (ring) / 1.1 (tint)** | same (paper is always white) |

Root cause: shadcn/ui's Tailwind v4 defaults set every focus indicator to the ring token at 50 %
alpha — `* { @apply outline-ring/50 }` in `src/index.css` and `focus-visible:ring-ring/50` in
`button.tsx`, `input.tsx`, `textarea.tsx`. `--ring` itself is oklch(0.5 0.18 265) ≈ rgb(48,88,199)
in light (6.1:1 on white) and oklch(0.68 0.16 265) ≈ rgb(103,147,250) in dark (6.6:1 on the dark
background); halving its alpha over the page background is what drops it to ~2.3.

WCAG 1.4.11 (AA) requires 3:1 for "visual information required to identify … states of user
interface components", and the Understanding document names the focus indicator explicitly; WCAG
2.2 §2.4.13 (AAA) states the same 3:1 for the focus indicator area. axe has no rule for this
(`color-contrast` checks text only), which is why R644–R666's zero-violation runs never saw it.
The R645–R650 focus-management work (focus lands on the right element) is unaffected — this is
about whether the user can *see* where it landed.

Not a gap: `ring-primary/40` on selected job cards / bulk-mode cards is a *selection* state that is
always paired with `border-primary` (6.1:1) — the border carries the state; left alone.
Dialog close ×, Dashboard sample-card preview button and PhotoCropDialog already use opaque
`ring-ring`.

## Fix (4 tokens + 2 preview classes)

```diff
 src/index.css
-    @apply border-border outline-ring/50;
+    @apply border-border outline-ring;
 src/components/ui/button.tsx    focus-visible:ring-ring/50 → focus-visible:ring-ring
 src/components/ui/input.tsx     focus-visible:ring-ring/50 → focus-visible:ring-ring
 src/components/ui/textarea.tsx  focus-visible:ring-ring/50 → focus-visible:ring-ring
 src/components/ResumePreview.tsx (×2 inline textboxes)
-  focus:bg-sky-100/70 focus:ring-1 focus:ring-sky-300
+  focus:bg-sky-100/70 focus:ring-2 focus:ring-sky-600
```

Opaque `--ring` measures 6.1 light / 6.6 dark against the page background; `sky-600` (#0284c7) is
4.7:1 on the white paper and stays visibly "editing-blue". Ring width, offset and geometry of the
ui primitives are unchanged (colour only), so no layout diff anywhere. The preview textboxes go
`ring-1 → ring-2`: the preview column is rendered under a `transform: scale(<1)`, so a 1px CSS ring
paints as a sub-pixel, anti-aliased line — the first deploy (`ring-1 ring-sky-600`) measured only
2.42:1 in rendered pixels (bluest pixel `rgb(91,175,226)`) even though the computed colour was
correct. A 2px ring guarantees at least one fully covered device pixel (`rgb(0,132,209)` → 4.02:1).
Box-shadow rings do not affect layout. The paper tint `sky-100/70` stays as a
secondary cue; the ring is the indicator that has to pass.

## Verification

- `npx tsc -b && npx eslint src/components/ui/button.tsx src/components/ui/input.tsx src/components/ui/textarea.tsx src/components/ResumePreview.tsx && git diff --check && npm run build && node scripts/verify-dist.mjs`
- deploy; discover bundle; `THEME=light|dark node qa/r667-focus.cjs 1280` (and 375) → weak/none 0
  on /dashboard and /builder with real ratios printed (no null); `qa/r667-focus-pixels*.cjs`
  → rendered ring ≥ 3:1 on link / input / outline button / card button / preview textbox in
  both themes; 0 console errors; storage restored to baseline (theme + example resume keys
  removed).

## Result (production, index-DE-3CXPP.js)

- Computed sweep (transitions disabled during measurement — the 150 ms `box-shadow` transition
  otherwise reads the pre-focus transparent layer): light/dark × 1280 on /dashboard, /builder,
  /jobs, /ats-checker and light/dark × 375 on /dashboard, /builder, /jobs → weak/none 0, nofocus 0;
  real ratios 6.1/6.27 (light) and 6.16/6.61 (dark) for every outline/shadow group; 0 console errors.
- Rendered pixels: nav link / primary button / search input / card button 6.1 (light); dark 6.61–6.64
  (or Chrome's white auto-outline 19.5 on link/card); builder input/textarea 6.27 light, 6.16 dark;
  outline button 5.94 / 6.28; preview inline textbox solid ring pixel 4.02 (was 1.6 → 2.42 with
  ring-1). Same numbers at 375 for the builder controls.
- Storage restored to baseline (`honestcv.resume/resumeHistory/theme` removed) after each run.

## Honest limits

- The preview inline textbox is not rendered at 375 (edit pane is the default mobile pane), so its
  ring was measured at 1280 only; the class is viewport-independent.
- The scanner's two defects (missing-alpha → NaN treated as pass; reading before the transition
  settled) are recorded in SOP-10 terms: a focus audit must composite alpha and disable/await
  transitions before sampling — the earlier "weak/none 0" was a false negative.
- Pixel sampling covers 8 representative controls; the class-level change covers every consumer
  of the three ui primitives and the global outline, which the computed sweep re-checks.
- Focus indicators inside dialogs were computed in the sweep only where the dialog was open in
  the route's default state; Radix dialog Close × was already opaque.
- No real screen-reader listening (irrelevant to a visual indicator) and no real-device keyboard.
