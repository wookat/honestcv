# R678 — SOP-10 audit node + forced-colors (Windows High Contrast) focus indicator: every shadcn Button / Input / Textarea has **no** visible focus in forced-colors mode

Date: 2026-09-07 · Chain: #898 (R677) → this PR

## Audit node (production, `index-DTRG8VKz.js`)

| dimension | method | result |
|---|---|---|
| axe (scrolling, 8 routes × 1280/375 × light/dark) | `qa/r666-scan.cjs` | real violations 0 except **dark 375 `/dashboard`: 2 color-contrast** — see below; obscured-only hits are the known sticky-header / 400px-step artefacts; unnamed focusables 0; console 0 |
| keyboard focus ring (8 routes × 1280/375 × light/dark) | `qa/r667-focus.cjs` | weak/none 0 (dark `/pricing` 39/35 = R668 computed-value false positive, UA outline renders white under `color-scheme:dark`); nofocus 5 = links inside closed `<details>`, correct |
| icon non-text contrast (WCAG 1.4.11) | `qa/r666-icons.cjs` | 0 below 3:1 (64 icon controls on builder) |
| text spacing (WCAG 1.4.12) 375/768/1280, 10 routes | `qa/r671-textspacing.cjs` | page overflow 0; newly clipped text **1** at 1280 = the hero product-mock resume preview (`max-h-[420px] overflow-hidden` + fade mask — an intentionally cropped illustration, cropped 161px more), not a defect |
| 120 static pages 320 default / 375 + spacing / 320 + spacing | `qa/r675-static-sweep.cjs`, `qa/r677-static-sweep320.cjs` (R677 run, same HTML) | 0 overflow |
| Rezi public pages | `qa/r668-rezi.cjs` → `qa/r678-rezi.json` | same product surface as R668 (builder / checker / keyword scanner / bullet & summary writers / cover & resignation letters / job search / AI interview); nav also lists “Chrome Extension” and “Rezi Resume MCP” (distribution channels, not in-app features; whether they were present at R668 is unknown — the R668 raw CTA list was not saved, this run’s is) |

### Dark 375 `/dashboard` axe color-contrast ×2 — false positive, verified by pixels

axe: `<a href="/jobs?job=2091088">` `#9199a5` on `#ffffff` 2.87:1 and the `text-primary` action
button `#6793fa` on `#ffffff` 2.94:1, related node = `div[data-resume-preview]` (the copy card’s
scaled thumbnail, `transform: scale(0.35)`, white).

`qa/r678-probe.cjs 375` (THEME=dark): the thumbnail sits in `div.pointer-events-none.relative.h-44
overflow-hidden` (y 206–382); its *unclipped* transformed box extends to y 598 and covers the
relationship row (y 418–457), which is why axe picks it as the background. `elementsFromPoint` at
the row centre returns a → p → … → `bg-card` (no preview). Rendered pixels of the row
(`shots/r678-dash-dark-375-linkbox.png`): background `rgb(18,22,29)` 3458 px, text `rgb(145,153,165)`
194 px → #9199a5 on #12161d ≈ **6.4:1**. No product change.

## Gap: forced-colors mode (Windows High Contrast / `forced-colors: active`)

Never audited before this node. Method: `qa/r678-forced.cjs 1280` — CDP
`Emulation.setEmulatedMedia({features:[{forced-colors:active},{prefers-color-scheme:dark}]})`,
focus the first 40 tabbables per route, read computed `outline-style`, then pixel-diff a control
unfocused vs focused (`qa/r678-forced-fix.cjs`).

| route | focused controls with `outline-style: none` (first 40) |
|---|---|
| `/` | 11 — every `Button` (hero CTAs, suite CTAs) |
| `/builder?example=accountant` | 19 — toolbar buttons, Backup/Restore/Copies/Share, the first `Input` |
| `/dashboard` | 13 |
| `/jobs` | 6 (incl. the 3 search/filter `Input`s) |
| `/documents` | 6 |
| `/ats-checker` | 5 (both `Textarea`s) |
| `/pricing` (static) | 0 — UA outline `auto 1px` |
| `/samples` | 10 (sample-card `Preview …` buttons too) |

Pixel proof (`shots/r678fix/*-compare.png`): landing CTA `<a>` and `/ats-checker` “See an example
score first” `<button>` — **blur → focus diff bbox = None**: not a single pixel changes when the
control receives keyboard focus. Cause: `buttonVariants` / `Input` / `Textarea` carry Tailwind v4
`outline-none` (`outline-style:none`) and rely on `focus-visible:ring-*` — a `box-shadow`, which
forced-colors mode discards. Static pages are fine because they never suppress the UA outline.
(R667 measured focus rings only in normal rendering; box-shadow rings are exactly what forced
colors removes.)

Tailwind v4 provides `outline-hidden` for this: `outline-style:none` plus, under
`@media (forced-colors:active)`, `outline: 2px solid transparent; outline-offset: 2px` — the
transparent colour is forced to the system focus colour. Measured in production by injecting
that rule on the focused control: outline becomes `rgba(0,230,255,.8) solid 2px` and the diff bbox
is the 2px ring around the control.

Measured pitfall (`qa/r678-forced-rest.cjs`): the *unconditional* `outline-hidden` (as generated
for a bare class) also paints the outline at rest — `rgb(255,255,255) solid 2px` on an unfocused
button — so rest and focus would differ only by colour. The fix therefore scopes it to
`focus-visible:` (`focus:` where the component already uses `focus:` for its ring).

## Design (class-only, no layout / colour change in normal rendering)

`outline-hidden` compiles to the same `outline-style:none` as `outline-none` outside forced
colors, so nothing changes for regular light/dark users; in forced colors a 2px system-colour
outline appears on `:focus-visible` (`:focus` for the preview inline editors) only.

```diff
ui/button.tsx      … outline-none focus-visible:border-ring …
+                  … outline-none focus-visible:outline-hidden focus-visible:border-ring …
ui/input.tsx       … transition-colors outline-none focus-visible:ring-2 …
+                  … transition-colors outline-none focus-visible:outline-hidden focus-visible:ring-2 …
ui/textarea.tsx    (same as input)
Dashboard.tsx      sample-card title button: focus-visible:outline-none → focus-visible:outline-hidden
PhotoCropDialog    crop surface:             focus-visible:outline-none → focus-visible:outline-hidden
ResumePreview ×2   inline editors: outline-none focus:bg-sky-100/70 … → outline-none focus:outline-hidden focus:bg-sky-100/70 …
```

Left as is: `ui/dialog.tsx` DialogContent already uses `outline-hidden` (a rest outline around
an open dialog is desirable in forced colors). Other shadcn primitives (select, checkbox, tabs,
dropdown items) do not suppress the UA outline, so they keep the UA focus ring in forced colors.

Out of scope (candidate R679): `Button asChild` links (`<a>`) have `border: 0` and forced colors
drops their background — the landing CTAs render as bare yellow text with no button box, while
real `<button>`s get the UA `ButtonBorder`. Needs its own measurement / design.

## Verification (production, `index-uSMKYuvU.js`)

- `qa/r678-forced.cjs 1280` / `375` (CLEAR_DRAFT=1 for the builder so the "Load this example?"
  dialog does not inert the page): focused controls with `outline-style: none` **0 / 0** on all
  8 routes (before: 11/19/13/6/6/5/0/10 at 1280); builder 60/274 and 60/156 controls checked.
- `qa/r678-forced-fix.cjs`: blur→focus pixel diff is now the 2px ring on the landing CTA `<a>`
  (bbox 6,6,265,58), the `/ats-checker` `<button>` (6,6,249,50) and `Textarea` (6,6,438,272);
  before the fix the CTA and button diffs were `None`. Rest state unchanged (no outline until
  `:focus-visible`).
- Normal rendering: `qa/r667-focus.cjs` light/dark × 1280/375 — weak/none 0 on all routes except
  the known dark `/pricing` UA-outline computed-value false positive (39/35, R668). One extra hit
  on the first light-1280 builder run was the "Load this example?" dialog’s Close × (scanner read
  the `ring-offset` background layer as the ring, `r:1`); pixel check `qa/r678-dialogclose.cjs`:
  the real ring layer `oklch(0.5 0.18 265) 0 0 0 4px` renders — not a defect, not touched.
- `qa/r670-verify.cjs r678` vs the R674 snapshot: 48 groups, 42 identical; the 6 differing
  are only the builder role-row `top` (2805→2443 etc.), which follows the draft content above
  it (the runs above cleared/loaded the example draft); x/width/height identical.
- Console errors 0 in every run; storage keys back to baseline.
- Honestly unverified: real Windows High Contrast (CDP media emulation only; system colours and
  the focus colour come from Chrome’s emulation palette), real screen readers, real devices.
