# R814 — Builder Pages view cuts its column between line boxes, never through one

## Evidence (production R813, before)

R813 QA: the Pages view windows one continuous content column with
`translateY(-i × windowH)` inside `overflow: hidden` frames, so a text line that
straddles a page boundary is drawn half at the bottom of page _n_ and half at the top of
page _n+1_ (Classic · XL · loose · wide, both widths; Flow shows the same line whole).

- `qa/r814-sweep.cjs` on the frozen R813 build (`/home/ubuntu/qa/r814-wt` = `e43194d`,
  `vite preview --port 4174`; 63 rows = authored + Sumit / Oxford / Kenneth / Giovanni /
  Bhu / Alex × classic / modern / sidebar × xs / m / xl; every text-run rect of the
  column tested against every frame's visible bottom): **154 bisected lines in 38/63
  rows** across 149 page boundaries (`/home/ubuntu/qa/r814-frozen2-sweep.log`). The
  authored Classic XL row alone cuts a bullet glyph on page 3, `Migrated ledger through
Postgr…` on page 3 and another bullet on page 4.
- The split is a pure windowing defect: page count and meter are R813's; the DOM holds
  the full text; which line is cut depends only on content.

## Fix

### `src/lib/pageCuts.ts` (new, pure)

`pageCuts(lines, contentH, windowH, slack)` returns the column offset each page starts
at. Walking page by page, the natural cut `start + windowH` is moved up to the top of any
line box it would run through (or that lies within `slack` of it), so that line opens the
next page. When the cut lands on a line's top it backs into the whitespace above that
line by up to `slack`, never past half the gap, and never into a neighbouring box — a
box that begins above the line and reaches into it (sub-px overlap between adjacent
rects) counts as no gap. A box taller than a page is the one exception and is cut
through, as before (no infinite loop).

`lineBoxesOf(content, scale)` collects every text-run rect (`Range.getClientRects()` per
text node) and `<img>` under the content column in the column's own px (the frame's
`scale()` divided out).

### `src/components/ResumePreview.tsx`

- `PaginatedPages`: state is `starts: number[]` (was a page count). `measure()` computes
  `pageCuts(lineBoxesOf(content, s), content.scrollHeight, windowH, cutSlack(s))`;
  `keepIfEqual` keeps the previous array when nothing moved (no render loop with the
  `ResizeObserver`). Frame _i_ translates by `-starts[i]` and clips its window to
  `min(windowH, starts[i+1] − starts[i])` so the pushed line is not visible at the
  bottom of page _i_ either.
- `FlowPage`: the same `starts` place the dashed "Page break" markers, so Flow and Pages
  agree on where each page ends (`top = pagePad + start`).
- `cutSlack(scale) = 1 / scale + 0.5` column px: the same text run measures up to one
  device pixel differently on the untransformed first frame and the translated frames.
- Zoom (`fontScale × 96/72`, R813), page frames, meter, exporters and the unpaginated
  thumbnail are untouched.

## Measured (63-row sweep, `qa/r814-sweep.cjs`)

| build                          | boundaries | bisected lines | rows with a split | `ceil(meter)` matches |
| ------------------------------ | ---------- | -------------- | ----------------- | --------------------- |
| frozen R813 (`:4174`)          | 149        | 154            | 38/63             | 55/63 (1 under)       |
| R814 local `dist` (`:4173`)    | 151        | **0**          | **0/63**          | 53/63 (1 under)       |
| R814 production (after deploy) | 151        | **0**          | **0/63**          | 53/63 (1 under)       |

Production rows (`/home/ubuntu/qa/r814-prod-sweep.log`) equal the local rows meter for meter
and frame for frame; served `index-DvQi3uZY.js` / `ResumePreview-B3-lWx0H.js` / `Builder-CFW7cHUy.js`
/ `SharedResume-ClK5SsDL.js` SHA = local `dist/client`. Boundary strip
`/home/ubuntu/qa/r814/shots/r814-boundary-compare.png` (Classic XL, page 3 → 4, dpr 2):
the frozen build draws the top half of "Migrated ledger through Postgres …" at the page-3
bottom and the bottom half at the page-4 top; production ends page 3 after "… with durable"
with clear space below and opens page 4 on the whole next line.

Two rows gain one frame because a line that used to be cut in half now opens a new page:
authored · sidebar · xs (meter 1.80, 2 → 3 frames) and Kenneth · modern · m (meter 6.51,
7 → 8). Both are documents whose column ends within one line of a page boundary; the
meter (PDF-derived) stays the authoritative count and no row is under-counted more than
before.

`qa/r814-mobile.cjs` (5 representative rows × 375 / 1280, hidden-scrollbar emulation):
0 bisected lines, paginated zoom 1.54667 / 1.33333 / 1.12 for xl / m / xs, frame width
315 at 375 with `scrollWidth 375 = visualViewport 375`, Flow markers = Pages starts +
`pagePad` on every row, Flow has no page labels, storage restored.

## Tests (251 → 260)

`tests/page-cuts.test.ts` (new, 9): single page; exact multiples untouched; a cut through
a line moves to its top and the page after it starts there; a line within `slack` of the
cut counts as straddling; overlapping boxes on one line; a box taller than a page is cut
through (no loop); gap back-off ≤ slack and ≤ half the gap, none when the line above
reaches into the straddler; 40 deterministic pseudo-random résumé-shaped columns (section
gaps, headings, 1–4-line paragraphs, ≤ 1px per-frame jitter) — every page ≤ `windowH`,
no line bisected with ≥ `slack` clearance, last page fits. The randomised case caught the
overlap hole in the first `gapAbove` (cut 2.2px into the line above at layout 0) before
the fix.

## Rejected

- Snapping the cut to the nearest line box _either_ way (down as well as up): moving the
  cut down shows more than `windowH` of content on the page — the frame would clip a line
  at its bottom edge anyway.
- Giving each page its own React subtree (true per-page layout): 25 templates ×
  structured sections would need a page-break-aware renderer; the repeated-frame model
  with line-box cuts gives the same visible result for the preview.
- Widening the sweep's 0.5px split threshold to pass: not done — R814 reads 0 at 0.5px.
