# R682 — builder colour swatches keep their colour under forced-colors

Chain: R681 (#902) → this round.

## Evidence (production, CDP `forced-colors: active` + dark scheme, `qa/r682-evidence.cjs 1280|375`)

R681 left 9 builder controls as "indistinguishable by design": the Accent colour swatches
(8) and Text colour swatches (3) in the Design toolbar of `/builder`. They are
`<button aria-pressed>` wrapping a `<span style="background: <colour>">` circle with a
`border-2 border-transparent` (selected: `border-primary`).

Under forced-colors the swatch background — which *is* the information — is replaced by
`Canvas`, and the transparent border is repainted `CanvasText`:

| swatch | author background | rendered background (forced-colors) |
| --- | --- | --- |
| Accent #1a1a1a / #334155 / #7c2d12 / #1d4ed8 / #6d28d9 / #be123c / #15803d | each its own colour | `rgb(0, 0, 0)` — all 7 identical |
| Text colour black / navy | #000 / #1f3a5c | `rgb(0, 0, 0)` — identical |
| selected Accent #0f766e / Text default | kept (R680 `forced-color-adjust: none` is inherited from the pressed button) | kept |

Unselected swatches: 9 rendered, **1 distinct background**. `qa/shots/r682-combo.png` (top rows):
eight empty white rings — the user can tell *which* swatch is selected (R680) but not what colour
any swatch would apply. The only remaining cue is the `aria-label` ("Accent color #7c2d12"), i.e.
sighted users must read hex codes. WCAG 1.4.1 (colour as the only visual means) is the wrong lens
here — the colour *is* the content, like an image — so the correct fix is to exempt exactly these
elements from forced colours, which is what `forced-color-adjust: none` exists for (CSS Color
Adjust 1 §3: "…for elements whose colour is meaningful, e.g. a colour picker swatch").

## Design

Only two call sites exist (`grep style={{ background` → Builder.tsx accent + text-colour swatches),
so this is done at the call sites with Tailwind v4's built-in `forced-colors:` variant rather than a
global rule:

```tsx
className="block size-5 rounded-full border-2 transition forced-colors:[forced-color-adjust:none] forced-colors:border-[CanvasText] …"
```

- `forced-color-adjust: none` on the swatch `<span>` only — the surrounding `<button>` still gets
  the system palette (Highlight when pressed via R680, focus ring via R678).
- `border-color: CanvasText` on the span so dark swatches (#1a1a1a, #000) on a dark Canvas and any
  swatch on a light Canvas still show a closed ring; previously `border-transparent` disappears once
  `forced-color-adjust: none` stops the UA from repainting it (prototype without this line: border
  `rgba(0,0,0,0)`).
- Selected swatch: the button gets Highlight background + Highlight border (R680); the inner span keeps
  its colour and now a CanvasText ring — still distinguishable from siblings (button background).
- Normal rendering: the `forced-colors:` variant is a media query; no bytes change outside it.

Prototype (`qa/r682-evidence.cjs 1280 proto` / `375 proto`, same CSS injected): unselected swatches
9 → **9 distinct backgrounds**, borders `rgb(255,255,255) 2px`; `qa/shots/r682-combo.png` bottom rows.

## Verification plan

- Deploy, then `qa/r682-evidence.cjs 1280` / `375` without `proto` → 9 distinct backgrounds, CanvasText
  border, zero console errors, storage back to baseline.
- Normal mode: swatch `forcedColorAdjust` = `auto`, border colour unchanged (`transparent` /
  `border-primary`) at 1280 and 375.
- Regressions: `qa/r680-state.cjs` (selected swatch still differs from siblings), `qa/r678-forced.cjs`
  (focus outlines), `qa/r681-proof.cjs` (must not regress elsewhere; note its heuristic compares the
  button's own text colour/frame and never looks at a child's background, so it keeps counting the 9
  swatch buttons as "indistinct" even once their spans are visibly coloured — `r682-evidence.cjs` is
  the measurement that matters for this round).

## Result (production, index-8Az81lmn.js, served CSS `forced-colors\:border-\[CanvasText\]{border-color:canvastext}`)

- `r682-evidence.cjs 1280` / `375`: unselected swatches 9 → 9 distinct rendered backgrounds, border
  `rgb(255,255,255) 2px`, selected button still Highlight `rgba(0,230,255,.8)`; console 0.
- `r682-normal.cjs 1280` / `375`: `forced-color-adjust: auto`, borders `transparent` / `oklch(0.5 0.18 265)`,
  20px / 22px (scale-110) — unchanged.
- `r680-state.cjs` builder 12 selected / 0 indistinct; `r678-forced.cjs` builder 0 without outline;
  `r681-proof.cjs` 1280 totals unchanged (79 / 33, see heuristic note above).

## Not verified

Real Windows High Contrast (CDP emulation only). Whether a user who chose High Contrast *because*
author colours hurt them wants these 11 small circles to keep author colours: the spec and MS guidance
say yes for pickers; a 20px swatch is well below any full-bleed region, and it is only shown in the
Design toolbar.
