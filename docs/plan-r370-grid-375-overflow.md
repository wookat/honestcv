# R370 — fix dashboard grid 375px overflow from long copy names

## Evidence (production, CDP-measured)
- Repro: a saved copy whose name renders wider than ~317px nowrap at `text-sm` (e.g.
  "Freelance Copywriter — Coalition Technologies (2)", 340px) makes the dashboard grid
  view overflow at 375px: `scrollWidth` 382 vs 375 (card min-content 366px > 343px track).
- Root cause: the card grids (`grid gap-4 sm:grid-cols-2 lg:grid-cols-3`) set no base
  column, so the implicit mobile column auto-min-sizes to the item min-content. The copy
  name `<p class="truncate …">` is `white-space: nowrap`; its intrinsic min-content
  propagates through `min-width: auto` flex-col parents into the grid track, so `truncate`
  never gets to clip.
- Toggle proof: setting only that `<p>` to `white-space: normal` flips scrollWidth 382 → 375.
- Not the culprit: Thumb (overflow-hidden), ATS meta line, buttons row, sr-only spans.
- List view and the Builder Copies dialog are unaffected (verified strict at 375 in R369).

## Fix
Add `grid-cols-1` (Tailwind → `repeat(1, minmax(0, 1fr))`) to the three dashboard card
grids (draft/new/import row, copies grid view, samples grid). `minmax(0, 1fr)` zeroes the
track's min-content floor so the existing `truncate` ellipsizes as intended. ≥sm breakpoints
already use `grid-cols-2/3` with the same minmax semantics — byte-identical there.

## Acceptance
- 375px grid view with a 50-char copy name: scrollWidth 375, name ellipsized, no clipped card chrome.
- sm/lg layouts unchanged; list view unchanged; samples grid unchanged at ≥sm.
- tsc/eslint/build green; production QA strict-overflow at 375 light/dark; R369 naming regression.
