# R818 — Function benchmark refresh + /jobs keeps one pane while the workspace sidebar shares the row (768–1023 px)

Chain: R817 (#1035) → this PR.

## Benchmark refresh (SOP-10, function-oriented, first-hand)

- Rezi public pages (`/home/ubuntu/qa/r818-rezi.mjs` → `r818-rezi.json`): `/`, `/ai-resume-builder`,
  `/pricing`, `/resume-checker`, `/job-search`, `/ai-cover-letter-builder`, `/ai-interview` reachable,
  titles / headings identical to the R813 snapshot; `/resume-keyword-scanner` still 404. No new public
  function since R813.
- Production routes: `/` `/builder` `/ats-checker` `/jobs` `/dashboard` `/documents` `/examples/` 200,
  `/pricing` 307 (unchanged).
- New evidence dimension this round: the 640–1023 px interval, never measured in R588–R817
  (`/home/ubuntu/qa/r818-midwidth.cjs`, R815 all-sections fixture, cache disabled, storage restored):
  `/` `/builder` `/dashboard` `/ats-checker` `/documents` `/jobs` at 640 / 768 / 1024. Page-level
  horizontal overflow 0 on every route; console / page errors 0. The overlap detector's hits were
  read one by one and classified: Builder date-picker trigger over its input (by design), Jobs row
  controls inside their card button and nav links sharing a row (DOM rectangles touch, hit-tested
  correctly), dashboard preview / save rectangles (stacked layers) — all false positives of the
  rectangle intersection test, not defects. Hidden (`display:none`) elements were excluded before the
  text-overflow pass.

## The gap that survived classification (P1, user-visible)

`/jobs` at 768–1023 px (`/home/ubuntu/qa/r818-jobs-geometry.cjs`, production before the fix):

| width | sidebar | main | list pane | detail pane | search input | long titles |
|------:|--------:|-----:|----------:|------------:|-------------:|-------------|
| 768   | 224     | 753  | **180**   | 269         | **46**       | clipped     |
| 820   | 224     | 805  | 200       | 300         | 98           | clipped     |
| 912   | 224     | 897  | 237       | 355         | 190          | clipped     |
| 1024  | 224     | 1009 | 282       | 423         | 302          | some clipped|
| 1280  | 224     | 1152 | 339       | 509         | 445          | few clipped |

Cause: `WorkspaceNav` shows the 224 px sidebar from `md` (768) **and** `Jobs.tsx` split the remaining
column into `md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]` at the same breakpoint, so the first
"desktop" width had a 180 px job list and a search box narrower than its own placeholder (282 px of
text in a 46 px box). The mobile history / scroll logic keyed off `(max-width: 767px)`, so 768–1023
had neither the phone behaviour (Back to list, browser Back closes the pane) nor a usable desktop one.

## Fix (`src/pages/Jobs.tsx`)

- Two-pane grid, list / detail visibility and "Back to list" move from `md:` to `lg:`
  (`lg:grid-cols-[…]`, `hidden lg:block`, `lg:hidden`).
- One constant `SINGLE_PANE_MQ = '(max-width: 1023px)'` replaces the two hard-coded
  `(max-width: 767px)` checks, so the sentinel-history Back and the scroll save / restore follow the
  same breakpoint as the layout.
- Search input gains `sm:min-w-72` (288 px ≥ the 282 px placeholder) so it cannot collapse when the
  filter row shares its line.

Rejected:
- Hiding the workspace sidebar until `lg` — every workspace page would lose its nav at 768–1023 for
  one page's sake; the sidebar is 224 px and readable there.
- A narrower list ratio (`[1fr_2fr]`) at `md` — 753 px minus gap still gives ≈ 245 px for the list and
  the search box still collapses; titles still clip.
- `md:` panes with a wrapping search row — leaves the 180 px list untouched.

## Verification

- `tests/jobs-panes.test.ts` (+4, 272 → 276): all four fail on the R817 tree (grid still `md:`,
  panes `md`, `max-width: 767px`, no `sm:min-w-72`).
- Gates: vitest 276 / tsc app + `tsc -b` / eslint 0 errors (11 pre-existing warnings) / build /
  verify-dist 123.
- Local preview (`/home/ubuntu/qa/r818-verify.cjs`, `r818-jobs-geometry.cjs`): 768 → one pane, list
  465, search 356; 1023 → one pane, list 720; 1024 → two panes 282 / 423, search 302; 1280 → 339 /
  509, search 445. Single-pane flow at 375 / 768 / 1023: row tap shows the detail from the top with
  "Back to list", pushes one sentinel entry, browser Back returns to the list on `/jobs` with the
  list's scroll offset, "Back to list" pops the sentinel (`history.state` no longer carries the
  marker — `history.length` never shrinks after `back()`, an oracle error in the first run).
- Production QA after deploy: see `docs/handoff-context.md` (R818).

## Boundaries

- At 1024–1279 the list pane is 282–339 px, so the longest titles (≥ 30 chars at 14 px) still truncate
  with an ellipsis; the full title is in the detail pane. Widening further means changing the 2fr/3fr
  ratio for every desktop width (not in this round).
- `PlanCard` keeps `md:hidden` (it is the mobile plan card, unrelated to the pane split).
- The other workspace pages were only measured, not changed, in this round.
