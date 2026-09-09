# R813 — Builder preview page frames lay text out in PDF points

## Benchmark refresh (5 rounds since R808)

- Rezi public pages (`qa/r813-rezi.mjs` → `qa/r813-rezi.json`): all 8 pages, heading
  sets and byte counts unchanged from R808; keyword scanner still 404. No new public P0.
- Production routes: 8/8 reachable (`/pricing` 307 as before).
- P0/P1 list refreshed from first-hand QA: the top item is the R812 QA finding below.
  Queue unchanged otherwise (LinkedIn non-English export, Coursework/Awards 180px
  institution box, <44px grouped controls, mobile audit panel covering controls,
  nameless bare-city contact line).

## Evidence (production, before)

R812 QA: the same Classic (XL · loose · wide) resume was labelled **3 pages** in the
Builder preview, the length meter said **4.39 pages**, and the exported PDF had **5**.

- `qa/r813-sweep.cjs` (21 authored rows, 3 templates × 7 typography/margin variants):
  17/21 disagreed; every miss had the preview _below_ `ceil(meter)`.
- `qa/r813-fixtures.mts` + `qa/r813-sweep2.cjs` (63 rows: authored + 6 retained real
  documents × classic/modern/sidebar × xs/m/xl): preview page count matched
  `ceil(meter)` on **23/63**, mean |error| 0.98 pages, bias −0.98 (always under).
- Measured geometry on every row: `content.scrollHeight / contentRect.height ≈ 1.503`,
  i.e. the DOM lays the column out in one coordinate system and the frames window it
  in another.

The meter comes from `measureResumePdf()` (pdf-lib page count + last-page fill), so it
and the download always agree with each other; only the preview frames were off.

## Root cause

`ResumePreview` renders one content column inside 96dpi page frames (816×1056 px
Letter / 794×1123 px A4) and counts pages as `ceil(scrollHeight / windowH)`. The
template's text sizes are Tailwind px classes (`text-2xl`, `text-sm`, `text-[10px]`)
that stand for the export's **pt** sizes (`10.5pt` body, `9pt` dates, 72pt margins → 96px
frames). Inside a 96dpi frame a pt is 96/72 px, but the column was zoomed only by the
text-size setting (`zoom: fontScaleOf(resume)`), so the text was drawn 25% too small and
every page window held ~1.33× the PDF's lines. The preview understated the page count in
proportion to the length of the resume.

## Fix (`src/components/ResumePreview.tsx`, +5/−1)

```ts
const PX_PER_PT = 96 / 72;
zoom: fontScaleOf(resume) * (paginated ? PX_PER_PT : 1);
```

Only the paginated frames (Builder pages/flow views, `/s/:id`, Dashboard example
preview) change; the unpaginated card (thumbnails) keeps its own scale. Page count,
windows and translate stay as they were — they were right once the column was laid out
in the frame's unit.

## Candidate geometries measured on the frozen R812 build (63 rows, `vite preview` of

`/home/ubuntu/qa/r813-wt`, `qa/r813-sweep2.cjs`; combo = zoom × / pt-margin band / drop +0.1 lh)

| combo                                | `ceil` matches | under | mean \|err\| | bias      |
| ------------------------------------ | -------------- | ----- | ------------ | --------- |
| as shipped (R812)                    | 23/63          | 40    | 0.98         | −0.98     |
| **4/3 / px band / keep lh (chosen)** | **53/63**      | 2     | 0.13         | **+0.05** |
| 4/3 / px band / drop lh              | 55/63          | 7     | 0.13         | −0.10     |
| 1.25 / pt band / drop lh             | 55/63          | 0     | 0.11         | +0.10     |
| 4/3 / pt band / drop lh              | 40/63          | 0     | 0.42         | +0.42     |
| 1.3 / px band / drop lh              | 50/63          | 13    | 0.23         | −0.22     |
| 1.25 / px band / drop lh             | 43/63          | 20    | 0.38         | −0.38     |

## Rejected

- Hard-coding an exploratory factor because it scored well: `1.25/pt band/drop lh` ties
  the chosen combo's error (55 vs 53 matches, +0.10 vs +0.05 bias) but 1.25 has no
  coordinate meaning and draws the text 6% smaller than the export.
- `4/3 / pt band / drop lh` — the fully "PDF-faithful" geometry — over-counts (+0.42):
  the HTML column is inherently taller per line than pdf-lib's layout (web-font metrics,
  heading/bullet spacing), and the px band + `+0.1` lh happen to absorb that today.
- Dropping only the preview `+0.1` line-height: 55/63 but 7 under-counts (bias −0.10);
  an under-count is the user-visible failure (preview promises fewer pages than the
  download), so the +0.05 combo with 2 unders is kept.
- Labelling the frames with the PDF page count: the frames would then hide overflowing
  HTML content or show empty pages.

## Tests

`tests/preview-pages.test.ts` (+7, 244 → 251): the paginated frames' and the flow
view's content column zoom by `FONT_SCALE × 96/72` for xs/m/xl; the unpaginated card
keeps `FONT_SCALE` alone. Run against the frozen R812 worktree
(`/home/ubuntu/qa/r813-wt`): 6 failed (`expected 1 to be close to 1.333…`), 1 passed.

## Verification (built `dist` via `vite preview`, then production, same 63-row sweep)

- preview page count = `ceil(meter)`: **53/63** locally and **53/63** on production
  (was 23/63); DOM length − meter: mean |error| 0.13 pages, bias +0.05, 51/63 within
  ±0.2 page, 59/63 within ±0.3, extremes −0.58 / +0.47 (Kenneth's 22-entry LinkedIn
  export on modern/classic, the authored fixture on modern xs). 2 misses under, 8 over.
  Per template bias: classic −0.01, modern +0.12, sidebar +0.05; per typography:
  m +0.13, xl −0.11, xs +0.14. The exploratory combos that model _additional_ scaling
  now all overshoot, as expected.
- The first production sweep read 46/63: the Cloudflare edge still served the previous
  `/builder` HTML (old `index-*.js`) for the first rows minutes after the deploy; the
  rerun once the edge had refreshed read 53/63 with the same misses as local.
- Classic XL/loose/wide authored fixture: meter 4.39, preview **5** at 1280 and 375
  (`qa/r813-shots.cjs`), no horizontal overflow, 0 console errors, storage restored.

## Boundaries (recorded, not fixed)

- The preview is still an HTML rendering, not the PDF: web-font metrics, the preview-only
  `+0.1` line-height and heading sizes leave residual differences up to ~½ page on long
  resumes, so a resume that ends near a page boundary can be one frame off from the
  export; the meter (PDF-derived) remains the authoritative number.
- The page frames' margin band is the 32px-based `PAGE_PAD` (21/32/43 px), not the PDF's
  36/54/72pt (48/72/96 px at 96dpi), so each preview window is 6–12% taller than the PDF's
  usable height; the HTML column being correspondingly taller per line is what nets out
  to the +0.05 bias above. Moving the band to true pt margins with the 4/3 zoom was
  measured on the frozen build (table above) and over-counts (+0.42); it would need a
  matching line-metric correction and is left for a round with its own evidence.
- Sidebar template `paddingLeft: 86` and photo sizes are px stand-ins and scale with the
  same factor; not measured against the PDF sidebar column width.
- Page windows cut the continuous column at exact `windowH` multiples with no line-box
  snapping, so a line straddling a boundary is drawn half on each page (pre-existing;
  production QA screenshots `qa/r813/screenshots/desktop-boundary45-magnified.png`,
  `mobile-boundary.png`). First for R814.
