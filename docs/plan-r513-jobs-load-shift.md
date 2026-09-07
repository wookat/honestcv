# R513 plan — kill the /jobs load-in layout shift

## Evidence (first-hand, production)

- Lighthouse mobile on https://cv.zalize.com/jobs: performance 0.77, CLS 0.012 —
  the only non-zero CLS left on the primary routes. The `layout-shifts` audit
  pins the entire score on the jobs list container
  (`main#main > div.min-w-0 > div.mt-6 > div.bg-card`).
- CDP probe (throttled network, 412px mobile emulation) sampling every 200ms:
  - loading: `gridTop=681`, Locations skeleton row height **178px**
  - loaded: `gridTop=635`, real Locations chip row height **132px**
  → the grid jumps up 46px when the facet chips land.
- A desktop-width PerformanceObserver probe confirms the same source:
  `{"v":0.0068,"src":["mt-6 grid gap-4 md:grid-cols-..."]}`.

## Root causes

1. **Stale facet-chip skeleton.** The loading skeleton renders 7 chips with
   widths 112–168px — sized for the pre-R512 compound location labels
   ("LATAM, Europe, USA…"). Since R512 the real chips are 8 narrow
   single-region labels (measured 70–100px wide at 412px). The skeleton wraps
   into one more line than the real row, so everything below shifts up when
   data lands.
2. **Results-count row inserts post-load.** The R502 "{n} jobs found" status
   line (29px tall) renders only when `!loading`, so it pushes the list rows
   down inside the container when the fetch resolves.

## Fix (Jobs.tsx only)

1. Update the skeleton to 8 chips with widths matching measured single-region
   chips: `[86, 70, 89, 78, 86, 100, 77, 94]`.
2. Render the status line during loading too (`!error` instead of
   `!loading && !error`), showing "Loading jobs…" while loading — same
   classes, same height, and it replaces the skeleton's sr-only loading text
   (removed to avoid double announcement).

## Non-goals

- No change to facet computation, filtering, worker, or list-row skeleton.
- Widths are best-effort for the current feed; exact-zero CLS cannot be
  guaranteed for arbitrary future facet labels — goal is measured 0 on
  production data.

## Validation

- `npx tsc -b --noEmit`, `npx eslint src/pages/Jobs.tsx`, `npm run build`,
  `npm run verify-dist`.
- Deploy `npx wrangler deploy` (Workers Routes auth 10000 expected).
- Production QA: repeat the throttled CDP probe (gridTop stable across
  loading→loaded), Lighthouse /jobs CLS 0, count row shows "Loading jobs…"
  then "{n} jobs found", 375px overflow scan, no console errors.
