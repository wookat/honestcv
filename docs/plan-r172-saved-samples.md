# R172 — Saved samples on the dashboard sample library

## Rezi evidence (first-hand, 2026-08-31)

- `https://app.rezi.ai/dashboard/samples/library/pro` shows the Sample Library with a
  top-left tab pair **ALL SAMPLES / SAVED (0)**, a search box ("Search resume and cover
  letter samples by role or skill") and category chips (PRO / BUSINESS / PROGRAMMING / …).
- Each sample card can be saved to the SAVED tab, which shows a count of saved samples.
- Also re-confirmed this round (no gaps found, already covered by RezUp): the resume row
  menu (Settings / History / Duplicate / Review / Move / Download .PDF/.DOCX / Delete),
  cover & resignation letter tabs, drag-drop create row, per-copy dashboard downloads.
  `Review my resume` is a paid human-review service (12h/1d/2d turnaround pricing) —
  out of scope (payments deferred). `History → Versions` did not open any visible UI on
  the free plan (likely PRO-gated), so it is recorded but not benchmarked.

## Current RezUp behavior

The dashboard Sample library (`src/pages/Dashboard.tsx`) has search + sector filter
chips + preview dialog + "Use this example", but no way to mark samples as favorites —
users comparing several role samples must re-search each visit.

## Selected scope

Add a local-first saved-samples filter to the dashboard Sample library:

- Star toggle button on each sample card (over the thumbnail, top-right), toggles
  membership in `localStorage['honestcv.savedSamples']` (array of slugs).
- A `Saved (n)` filter chip rendered before the sector chips; active state shows only
  saved samples (search + sector still combine with it).
- Star also available inside the preview dialog footer so a user can save while reading.
- Empty saved state gets a dedicated hint ("No saved samples yet — tap the star…").
- Zero schema changes, no server involvement, `/examples/` static pages untouched.

## Acceptance criteria

- Star toggles persist across reload; count chip updates live.
- Saved view + search + sector filters compose; empty states are accurate.
- Grid layout unaffected; 1440 and 375 viewports show no overflow; touch targets ≥40px.
- Star buttons have aria-pressed + accessible names.
- Existing preview / Use this example / Browse all flows unchanged.
