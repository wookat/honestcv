# R679 — Primary / secondary / ghost buttons get a frame under `forced-colors: active` (Windows High Contrast)

Chain: R678 (#899) → this PR.

## Evidence (production `index-uSMKYuvU.js`, `qa/r679-evidence.cjs 1280`, CDP `forced-colors: active`)

Forced-colors mode removes every author `background-color` and `box-shadow`. shadcn's
`default` / `destructive` / `secondary` / `ghost` button variants convey their boundary with
background only (`bg-primary`, `bg-secondary`, …) and have `border-width: 0`, so in
Windows High Contrast they render as **bare text on the canvas** — indistinguishable from
surrounding copy — while the `outline` variant (`border`) keeps its frame:

| route (1280) | `data-slot=button` without any border | with border |
| --- | --- | --- |
| `/` | 9 (hero "Start free — no sign-up", "Build my resume", suite CTAs) | 6 |
| `/builder?example=accountant` | 34 (toolbar, "Tailor to this job", Save …) | 34 |
| `/dashboard` | 12 ("Create new resume", "Open editor", "Use this example" ×N) | 6 |
| `/jobs` | 3 ("Search", "Target my resume", "Create new resume") | 3 |
| `/documents` | 2 | 4 |
| `/ats-checker` | 2 ("Check my ATS score", "Build my resume") | 2 |
| `/samples` | 11 | 0 |

Pixel evidence `qa/shots/r679/`: dashboard "Create new resume" (`default`, computed
`border-width: 0px`, `background: rgb(0,0,0)`) is plain white text; "Back up everything"
(`outline`, `1px`) has a visible frame. The landing hero CTA (`Button asChild` → `<a>`) is plain
yellow LinkText. The visual hierarchy is inverted: the primary action is the *only* one that
looks like it is not a button. (MDN forced-colors guidance: elements whose boundary relies on
background colour should carry a border so the system palette can draw it.)

Not a WCAG failure per se; it is a usability defect for High Contrast users that the R678
forced-colors node made measurable for the first time. `/pricing` is a static page and has
no `data-slot=button` (its CTAs are plain `<a>` — separate audit).

## Design

Tailwind v4 (4.3.3 installed) ships the `forced-colors:` variant
(`@media (forced-colors: active)`). Add a 1px border **only** in that mode to the variants
that rely on background:

```diff
 ui/button.tsx buttonVariants
-  default:     'bg-primary text-primary-foreground …',
+  default:     'forced-colors:border bg-primary text-primary-foreground …',
-  destructive: 'bg-destructive text-white …',
+  destructive: 'forced-colors:border bg-destructive text-white …',
   outline:     'border bg-background …',                       (already framed)
-  secondary:   'bg-secondary text-secondary-foreground …',
+  secondary:   'forced-colors:border bg-secondary text-secondary-foreground …',
-  ghost:       'hover:bg-accent …',
+  ghost:       'forced-colors:border hover:bg-accent …',
   link:        (unchanged — it is meant to look like a link)
```

`forced-colors:border` compiles to `@media (forced-colors: active) { border-style: solid;
border-width: 1px }`; the colour is forced by the browser (ButtonBorder / LinkText), so no
colour token is needed. Outside forced-colors the CSS is inert — light/dark geometry and
colours are byte-identical.

Inside forced-colors the buttons grow 1px per side (`h-9` is fixed so the content box shrinks
2px; `inline-flex` width grows 2px) — the same box the `outline` variant already has, so rows
that mix variants become *more* aligned, not less.

Out of scope (recorded for later rounds): raw `<button>`s that are not `Button` (segmented
controls, chips, pane switcher — "BUTTON:other" in the evidence, 11–44 per route) and the
static `/pricing` CTAs.

## Verification

- `qa/r679-evidence.cjs 1280` / `375` on production after deploy: `data-slot=button`
  "NOFRAME" count must be 0 for every variant except `link`; screenshots of the same three
  controls show a frame on "Create new resume" and the hero CTA.
- Normal rendering unchanged: `qa/r670-verify.cjs` snapshot vs R678 run; a normal-mode
  pixel diff of the dashboard "Create new resume" button before/after must be empty.
- `qa/r678-forced.cjs` (focus outline) still 0; `qa/r667-focus.cjs`; console 0; storage baseline.
- Honestly unverified: real Windows High Contrast palette (CDP emulation only).

## Verification (production `index-CdsS47gU.js`, 2026-09-07)

- `qa/r679-evidence.cjs 1280` (8 routes) and `375` (4 routes), forced-colors emulation:
  every `data-slot=button` element now reports `border-width: 1px` except the 5 landing
  `variant="link"` anchors (intended). Dashboard "Create new resume" `default` → `bw 1px`;
  hero CTA `<a>` screenshot shows a yellow LinkText frame (`qa/shots/r679/01-…`).
- Normal rendering byte-identical: `qa/r679-normal.cjs before/after` — dashboard default
  button (232×44 crop), hero CTA (259×52), builder ghost icon button (46×40): pixel diff bbox
  `None` ×3; bounding boxes and `border-width: 0px` unchanged.
- `qa/r678-forced.cjs 1280`: focused controls with no outline 0/0 on all 8 routes.
- Console errors 0; storage back to baseline.
- Unverified: real Windows High Contrast (CDP media emulation only); raw non-`Button`
  `<button>`s (segmented controls, chips, pane switcher) and static `/pricing` CTAs remain
  frameless — follow-up candidates.
