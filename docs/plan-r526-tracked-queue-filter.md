# R526 — filter the tracked application queue by title or company

## First-hand production evidence (CDP, cv.zalize.com)

- Seeded 25 tracked jobs across the five statuses, opened `/jobs?tab=tracked`:
  all 25 rows render in one grouped list, and **zero** visible inputs exist on
  the Tracked tab (`main input` visible count = 0). The search box, category,
  location, type and skills filters are all gated to the All-jobs tab.
- A user tracking a realistic number of applications has no way to find one
  ("that Acme role") except scrolling the whole queue. Rezi's job tracker is
  built around finding tracked roles quickly (2026-08 changelog: "Improved Job
  Description Visibility ... for tracked roles").
- Also verified while auditing: the grouped status headers show
  `Label (counts[status])` from the *whole* pipeline, so any row-level
  filtering (today: the existing Needs-follow-up toggle) makes the header
  count disagree with the rows listed under it.

## Fix (Jobs.tsx only)

- New `trackedFilter` state; a small text input in the existing tracked-tab
  actions row filters the queue by case-insensitive substring against
  `title + company`.
- `trackedQueue` applies the filter alongside the existing `followUpOnly`
  predicate; grouping and within-group ordering unchanged.
- Group headers count the rows actually listed in the group (fixes the
  preexisting Needs-follow-up mismatch too).
- Honest empty state: filter active with zero matches shows
  `No tracked jobs match "…"` with a Clear filter button (same pattern as the
  R501 all-tab recovery).

## Non-goals

- No URL persistence for the filter (transient find-in-list, unlike the
  shareable all-tab search context).
- No changes to the all-tab search/filters, bulk actions, status tabs,
  detail pane, or pipeline storage.

## QA plan

Desktop + 375px production passes with the dedicated console/error hook:
seed a multi-status pipeline, filter hits/misses, clear-filter recovery,
group header counts match visible rows, Needs-follow-up still composes,
zero console errors, synthetic storage cleaned.
