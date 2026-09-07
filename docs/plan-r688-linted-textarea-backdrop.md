# R688 — builder bullet textareas: the lint backdrop hides the real field under forced-colors, and drifts off its lines in every mode

## Audit node (SOP-10, production `index-Bp2TguoI.js`)

`qa/r666-scan.cjs` (8 routes × 1280/375 × light/dark, axe every 400px, custom contrast, tabbable/unnamed counts), `qa/r678-forced.cjs 1280` (forced-colors focus), `qa/r677-static-sweep320.cjs` (120 sitemap URLs at 320), `qa/r668-rezi.cjs` (Rezi public pages), `qa/r688-disabled.cjs` (disabled controls under forced-colors). Logs: `qa/r688-scan.log`, `qa/r688-forced.log`, `qa/r688-static.log`, `qa/r688-rezi.json`.

- light/dark × 1280/375: axe real violations 0 on all routes except dark 375 `/dashboard` (2). `qa/r688-probe.cjs` shows both are axe background-resolution artifacts: the job link's real ancestor chain is `bg-card oklch(0.2 …)` → `body oklch(0.16 …)` while axe paired it with the white `[data-resume-preview]` card (`#9199a5` on `#ffffff` = 2.87). Screenshot `qa/shots/r688/02-dash-dark-note-375-375.png` shows the link on the dark card. Not a product defect.
- 320 static sweep: 120 URLs, 0 overflowing. Forced-colors focus: 0 focused controls without an outline. Console errors: 0 everywhere. Disabled controls: system colours + `opacity .5`, distinguishable from enabled siblings.

The remaining gap came from the one component that paints text over another text field: `LintedTextarea`.

## Evidence (`qa/r688-linted.cjs`, `qa/r688-linted2.cjs`, `qa/r688-linted3.cjs`, `/builder?example=accountant`, experience bullets textarea)

`LintedTextarea` draws a pointer-transparent `<div aria-hidden class="… text-transparent">` on top of the `<textarea>` that mirrors the value line by line so flagged lines can carry a wavy amber underline (`decoration-amber-500 decoration-wavy`) and the hovered guidance line a `bg-amber-200/60` highlight.

### Forced-colors: the mirror replaces the field

|                         | normal                                 | forced-colors (CDP emulation)                                                                                                                   |
| ----------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| backdrop `color`        | `rgba(0,0,0,0)`                        | `rgb(255,255,255)` (CanvasText)                                                                                                                 |
| backdrop `border-color` | transparent                            | CanvasText (doubles the textarea border)                                                                                                        |
| Ctrl+A in the textarea  | Highlight band + HighlightText visible | **no selection visible at all** — `qa/shots/r688/linted-forced-selected-1280.png`                                                               |
| text shown              | textarea's own text                    | the mirror's text (Chrome paints a Canvas backplate behind forced-colour text, so the mirror covers the textarea's glyphs, caret and selection) |

With a prototype `forced-color-adjust: none` on the backdrop (`linted-forced-selected-1280-proto.png`) the selection band and the real text come back.

### All modes: the mirror does not wrap or scroll like the textarea

|                                                             | 1280                                                            | 375                       |
| ----------------------------------------------------------- | --------------------------------------------------------------- | ------------------------- |
| textarea `clientWidth` / backdrop `clientWidth`             | 528 / 543                                                       | 251 / 266                 |
| `scrollHeight` textarea / backdrop after 5 lines            | 176 / 176                                                       | 296 / 276                 |
| `scrollTop` textarea / backdrop after typing a flagged line | 71 / 60                                                         | 191 / 160                 |
| flagged span rect vs textarea box                           | y 503–520 inside box 413–511 → **underline clipped, invisible** | y 463 … one full line off |

Cause 1: the textarea has a 15px classic scrollbar once it overflows; the backdrop is `inset-0` with no scrollbar, so it wraps 15px wider and lines fall on different rows. Cause 2: `scrollTop` is only synced in `onScroll`; when typing adds a line the textarea scrolls before React has rendered the new mirror line, so the mirror clamps at its old maximum (156 − 96 = 60) and stays there.

Screenshots `linted-normal-selected-1280.png` (normal: no amber underline visible under the flagged line) and `linted-forced-rest-1280.png` (mirror wraps "weekly leadership / reviews" while the textarea wraps "weekly / leadership reviews").

## Fix (`src/components/LintedTextarea.tsx` only)

1. Forced-colors: backdrop gets `forced-color-adjust: none` (keeps `color: transparent` and the transparent border, no backplate). Under `@media (forced-colors: active)` the wavy underline uses `CanvasText` and the hovered-line highlight becomes a 2px `Highlight` outline instead of an amber wash (Tailwind `forced-colors:` variants on the backdrop / line spans, same convention as R678–R686; backdrop gets `data-slot="linted-backdrop"` for QA).
2. Geometry: after every render (`useLayoutEffect` on `value` / `highlightLine`) and in a `ResizeObserver`, set the backdrop's `right` to the textarea's scrollbar width (`offsetWidth − clientWidth − borders`) and copy `scrollTop`. Normal-mode textarea layout is untouched; only the invisible mirror moves.

## Verification

- Local: tsc / eslint / build / verify-dist.
- Production 1280 + 375, `/builder?example=accountant` + typed "Responsible for various duties": backdrop `clientWidth` = textarea `clientWidth`; `scrollHeight` equal; `scrollTop` equal after typing; flagged span rect inside the textarea box; forced-colors: backdrop `color` stays `rgba(0,0,0,0)`, Ctrl+A selection band visible in the screenshot; underline `wavy` with CanvasText colour.
- Regression: R678–R687 forced-colors scripts unchanged; textarea rect and border identical before/after in normal mode; zero console errors; storage restored.

## Not verified

Real Windows High Contrast (CDP emulation); overlay-scrollbar platforms (macOS/mobile) where the gutter is 0 — the sync then sets `right: 0`, identical to today.
