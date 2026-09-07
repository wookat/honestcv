# R680 — Selected / pressed / current state stays visible under `forced-colors: active` (system `Highlight`)

Chain: R679 (#900) → this PR.

## Evidence (production `index-CdsS47gU.js`, `qa/r680-state.cjs 1280`, CDP `forced-colors: active`)

Every segmented control and toggle in the app conveys its selected state with colour only:
`bg-primary text-primary-foreground` (filters, chips), `border-primary` (option pills),
`ring-2 ring-primary/40` (Letter/A4, font, divider, bullet-indent, page-flow pickers) or
`bg-secondary` / `bg-accent` (builder section nav, WorkspaceNav). Forced-colors mode discards
author backgrounds and box-shadows and forces every border to the same system colour, so the
selected option is **pixel-identical to its unselected siblings**. The scanner compares each
`[aria-pressed="true"]` / `[aria-current]` / `[aria-selected="true"]` element with a sibling on
border-width/style, font-weight, text-decoration, outline and icon presence:

| route | selected controls | indistinguishable from sibling |
| --- | --- | --- |
| `/` | 1 (gallery filter "All (25)") | 1 |
| `/builder?example=accountant` (Design tab) | 12 | **11** — template filter, template card, accent colour, text colour, Letter/A4, font Auto/Serif, divider Auto/On, bullet indent Off/On ×3, Pages/Flow |
| `/jobs` | 3 | 1 ("All jobs" / "Tracked" / "Saved") |
| `/dashboard`, `/documents`, `/samples` | 2 / 1 / 2 | 0 (differ only by `font-weight` 500 vs 400 — weak but present) |

Pixel evidence `qa/shots/r680p/01-pagesize-before-1280.png`: "Letter" (selected) and "A4"
render as two identical outlined pills; computed `background-color: transparent`,
`border-color: rgb(255,255,255)` on both. The jobs skill chips (`bg-primary` when active)
have the same structure but no chip was active in the seeded state.

The `aria-pressed` / `aria-current` semantics are already correct everywhere (R644 audit), so
the state exists for AT users but sighted High-Contrast users cannot see it — WCAG 1.4.1
(Use of Color) in the one rendering mode where the author palette is gone.

## Design

Platform convention (Windows HC, CSS Color Adjust §3.1): system colour keywords are honoured
in forced-colors mode, and selected items use `Highlight` / `HighlightText`. One global rule in
`src/index.css`, keyed on the ARIA state that is already truthful, instead of touching 20+
call sites:

```css
@media (forced-colors: active) {
  [aria-pressed='true'],
  [aria-current],
  [aria-selected='true'] {
    forced-color-adjust: none;
    background-color: Highlight !important;
    color: HighlightText !important;
    border-color: Highlight !important;
  }
  :is([aria-pressed='true'], [aria-current], [aria-selected='true']) * {
    color: inherit !important;
  }
  :is([aria-pressed='true'], [aria-current], [aria-selected='true']):focus-visible {
    outline: 2px solid CanvasText !important;
    outline-offset: 2px !important;
  }
}
```

Why each line (all measured on production with `addStyleTag`, `qa/r680-proof.cjs` /
`qa/r680-proto.cjs`):

- Without `forced-color-adjust: none` Chrome still draws its Canvas text **backplate** over the
  `Highlight` fill, so `HighlightText` (black) text sits on a black backplate — the label
  vanished into a black rectangle (`qa/shots/r680p/02-pagesize-after-1280.png`, first attempt).
- `forced-color-adjust: none` also stops the border being forced, hence the explicit
  `border-color: Highlight` (the first attempt showed a residual author `oklch` border).
- `forced-color-adjust` inherits, so descendants would keep their author `text-muted-foreground`
  colours on the Highlight fill; `color: inherit` on descendants keeps everything
  `HighlightText`. Descendant author *backgrounds* (accent swatch dots, count badges) are
  intentionally left — in forced-colors they render their real colour inside the highlighted
  control, which is what a colour swatch should do.
- `forced-color-adjust: none` also switches off the UA recolouring of the **focus outline** that
  R678 relies on: the first deploy (`qa/r680-focus.cjs`) showed focused selected controls with
  the author `outline: oklch(0.68 0.16 265) auto 1px` (raw buttons) and — for shadcn `Button`
  toggles, whose `focus-visible:outline-hidden` is `2px solid transparent` — no ring at all.
  The explicit `2px solid CanvasText` / `outline-offset: 2px` restores a system-colour ring
  around the Highlight fill (`qa/r680-focus2.cjs`: hidden-role toggle and WorkspaceNav current
  link both `rgb(255,255,255) solid 2px`, offset 2px).
- Outside forced-colors the whole block is inert: computed values on the same controls are
  unchanged (`normal` line in `qa/r680-proof.cjs`).

Result on 11 representative controls (`qa/shots/r680proto-combo.png`): Letter, section nav
"Contact", accent swatch, template card, template filter, jobs "All jobs", WorkspaceNav
"Job search", the selected job card, dashboard filter, dashboard nav, landing gallery filter all
show a Highlight fill with HighlightText labels; siblings unchanged.

Scope note: `[aria-current]` also covers the header nav links and step indicators — the
Highlight treatment is the conventional HC rendering for "current" there too.

## Verification

- `qa/r680-state.cjs 1280` / `375` on production after deploy: indistinguishable count 0 on
  every route (scanner extended to compare background-color as well).
- Normal rendering: pixel diff of Letter/A4, builder section nav, WorkspaceNav, jobs filter and
  landing gallery filter before/after (`qa/r680-normal.cjs`) — bbox `None` on all five.
- Focused selected controls (`qa/r680-focus2.cjs`): outline is a system colour, not the author
  `--ring`, on both a shadcn `Button` toggle and a raw `[aria-current]` link.
- `qa/r679-evidence.cjs`, `qa/r678-forced.cjs` unchanged (frames / focus outlines).
- Console 0, storage baseline. Unverified: real Windows High Contrast palette.
