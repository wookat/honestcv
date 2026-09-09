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
  17/21 disagreed; every miss had the preview *below* `ceil(meter)`.
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
const PX_PER_PT = 96 / 72
zoom: fontScaleOf(resume) * (paginated ? PX_PER_PT : 1)
```

Only the paginated frames (Builder pages/flow views, `/s/:id`, Dashboard example
preview) change; the unpaginated card (thumbnails) keeps its own scale. Page count,
windows and translate stay as they were — they were right once the column was laid out
in the frame's unit.

## Rejected

- Hard-coding an exploratory factor (1.25 / 1.3 / "true margin" padding) because it
  scored well in the sweep: `1.25/true/true` also reached 55/63 but has no coordinate
  explanation and gets the visual size wrong.
- Labelling the frames with the PDF page count: the frames would then hide overflowing
  HTML content or show empty pages.
- Dropping the preview-only `+0.1` line-height: measured −0.10 bias vs +0.05; kept.

## Tests

`tests/preview-pages.test.ts` (+7, 244 → 251): the paginated frames' and the flow
view's content column zoom by `FONT_SCALE × 96/72` for xs/m/xl; the unpaginated card
keeps `FONT_SCALE` alone. Run against the frozen R812 worktree
(`/home/ubuntu/qa/r813-wt`): 6 failed (`expected 1 to be close to 1.333…`), 1 passed.

## Local verification (built `dist`, `vite preview`, same 63-row sweep)

- preview page count = `ceil(meter)`: **53/63** (was 23/63); mean |error| 0.13 pages,
  bias +0.05; 2 under, 8 over — all within ±0.2 page of a page boundary (HTML fonts vs
  the PDF's Helvetica/Times metrics). The exploratory combos that model *additional*
  scaling now all overshoot, as expected.
- Classic XL/loose/wide authored fixture: meter 4.39, preview **5** at 1280 and 375
  (`qa/r813-shots.cjs`), no horizontal overflow, 0 console errors, storage restored.

## Boundaries (recorded, not fixed)

- A resume that ends within ~0.2 page of a boundary can still be one frame off from the
  PDF; the meter (PDF-derived) remains the authoritative number.
- Sidebar template `paddingLeft: 86` and photo sizes are px stand-ins and scale with the
  same factor; not measured against the PDF sidebar column width.
