# R677 — Landing “suite” cards force page-level horizontal scroll at 320px under WCAG 1.4.12 text spacing

Date: 2026-09-06 · Chain: #897 (R676) → this PR

## Evidence (production, `index-DubLXy8S.js`)

Method: `qa/r671-textspacing.cjs 320` (ten routes, inject the standard 1.4.12 override
`*{line-height:1.5;letter-spacing:.12em;word-spacing:.16em} p{margin-bottom:2em}`, compare
`documentElement.scrollWidth` before/after and list newly clipped text boxes), then
`qa/r677-root.cjs 320` to find the overflow roots.

R671/R673 covered 375 + spacing and 640 + spacing; 320 + spacing (WCAG 1.4.10 width **and**
1.4.12 spacing together) had never been measured.

| route | 320 default | 320 + spacing |
|---|---|---|
| `/` | 305/305 | **328/305** — page scrolls horizontally |
| /builder, /dashboard, /jobs, /documents, /ats-checker, /pricing, /samples, /examples/, /guides/… | 305/305 | 305/305 |

Overflow roots on `/` (+spacing): the four cards of the “Everything from finding the posting…”
suite section (`div.mt-8.grid.gap-4.sm:grid-cols-2 > Card`), each 16→328 (312px wide in a
288px column). Cause: the card footer row

```tsx
<div className="mt-auto flex items-center gap-4 pt-3">
  <Button asChild variant="link" className="h-auto px-0"><Link>{s.cta} <ArrowRight /></Link></Button>
  {'learnMore' in s && <a …>How it works</a>}
</div>
```

is a non-wrapping flex row; `buttonVariants` carries `whitespace-nowrap`, so “Write a cover
letter →” + 16px gap + “How it works” has a min-content width of ~312px once letters are
spaced 0.12em. A grid item’s `min-width:auto` then widens the *track*, so all four cards (also
the two without a “How it works” link) grow to 312 and the page gains a 23px horizontal scroll.

Side findings, same run (`qa/r677-mock.cjs 320`), inside the hero product mock (aria-hidden
decoration, clipped by the card’s `overflow-hidden`, so never page-level):
- the three traffic-light dots in the fake browser bar are flex items without `shrink-0`; at
  320 + spacing the `cv.zalize.com/builder` pill’s min-content (175px) squeezes them to **0px**
  (default: 10/10/10);
- the preview column (`div.relative.bg-slate-100.p-4`, a grid item with `min-width:auto`)
  grows to the resume preview’s min-content — 33→294 vs card right edge 273 — so the card’s
  right padding/border and the absolutely positioned ATS-score badge (`right-4`, anchored to
  that column) are cut off by 21px.

Third finding (`qa/r677-static-sweep320.cjs`, all 120 sitemap URLs at 320 + spacing — the
R675 sweep only ran 320 default / 375 + spacing): 3 static example pages scroll horizontally
(`/examples/customer-service/` 323/305, `/examples/sales-representative/` 323/305,
`/examples/administrative-assistant/` 318/305). No *element* box is wider than the viewport
(`qa/r677-ex.cjs` finds no roots); `qa/r677-ex2.cjs` walks text ranges: the single words
“Representative” / “Administrative” in the 2rem `<h1>` (“Customer Service Representative resume
example”) become 307px wide with 0.12em spacing and overflow the 273px column as ink.

Non-findings: the `/` comparison table `min-w-[560px]` lives in its own `overflow-x-auto` box
(intended, default too); the fixed/sticky scan at 667×375 (`qa/r677-fixed-scan.cjs`) found no
pinned box with off-viewport controls after R674/R676 (the “Skip to content” hit is the sr-only
link at top −1; the /pricing hits were closed-`<details>` geometry — opening the menu measures
correctly, `qa/r677-pricing.cjs`).

## Design

Same pattern as R673 (hero CTA row): let the footer row wrap when it cannot fit, keep the
single-line layout whenever it does.

```diff
- <div className="mt-auto flex items-center gap-4 pt-3">
+ <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-3">
```

Product mock: dots keep their size, the pill is the element that shrinks (with an ellipsis),
and the preview column may not grow past its grid track.

```diff
- <span className="size-2.5 rounded-full bg-red-400/70" />            (×3)
+ <span className="size-2.5 shrink-0 rounded-full bg-red-400/70" />
- <span className="… ml-3 rounded-md border px-3 py-0.5 text-xs">cv.zalize.com/builder</span>
+ <span className="… ml-3 min-w-0 truncate rounded-md border px-3 py-0.5 text-xs">cv.zalize.com/builder</span>
- <div className="relative bg-slate-100 p-4 sm:p-8" style={{maskImage…}}>
+ <div className="relative min-w-0 bg-slate-100 p-4 sm:p-8" style={{maskImage…}}>
```

Static pages (`scripts/build-seo.mjs` shared CSS): headings may break a single word only when
it cannot fit on a line of its own.

```diff
- h1,h2,h3{font-family:'Sora','Inter',system-ui,sans-serif;letter-spacing:-.015em}
+ h1,h2,h3{font-family:'Sora','Inter',system-ui,sans-serif;letter-spacing:-.015em;overflow-wrap:anywhere}
```

`overflow-wrap:anywhere` never changes a heading that already fits (unlike `word-break`).

All four are layout-only; no copy, colour or DOM-order changes. Expected default-layout
change: at 320 and at the `sm` two-column widths (card ≈289px) the “How it works” link moves
to its own line under the CTA instead of being broken mid-phrase (“How it / works”, row 52px
today); at 375 and ≥1024 the row stays one line (48px).

## Verification

- `r671-textspacing.cjs 320`: `/` 305/305 → 305/305, no newly clipped text.
- `r677-root.cjs 320`: overflow roots at +spacing = only the intended table scroller.
- Default layout at 320/375/640/1280: card footer rows single-line where they fit (row height
  before/after: 375 and 1280 stay 48px; 320 and 640 change from a mid-phrase break to a second
  line — accepted, see Design).
- Mock at 320 + spacing: dots 10/10/10, pill ellipsized, preview column right edge = card right
  edge, badge fully inside the card; 375/640/1280 default geometry unchanged.
- Static: the 3 example pages 305/305 at 320 + spacing; `/examples/customer-service/` h1 line
  count at 320/375/1280 default unchanged.
- `r670-verify.cjs` snapshot (48 groups) unchanged; 120 static URLs at 320 + spacing 0 overflow
  (`r677-static-sweep320.cjs`); console 0; storage keys unchanged.
