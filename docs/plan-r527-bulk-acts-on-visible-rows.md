# R527 — Bulk actions only touch visible tracked rows

## Evidence (production CDP, 2026-09)

- Seeded 4 tracked jobs (Acme ×2, Globex, Initech), entered bulk mode on
  `?tab=tracked`, checked all 4 → "4 selected".
- Typed `globex` into the R526 tracked filter → 1 visible row, but the toolbar
  still shows "4 selected" and "Untrack 4".
- Confirming removed all 4 entries — 3 of them hidden off-screen at the time.
  `honestcv.jobPipeline` went to `[]` with zero console errors.
- Same applies to the "Move to…" bulk status change and to the pre-R526
  "Needs follow-up" filter: any filter can hide selected rows while bulk
  actions still hit them.

## Rezi comparison

Rezi's recent public updates emphasise a trustworthy application queue
("Streamlined Application Management", "Improved Application Tracking").
Destructive bulk actions on rows the user cannot see contradicts that and the
product's honesty principle.

## Fix (src/pages/Jobs.tsx only)

- Derive `visibleBulkIds` = selected ids intersected with the rows currently
  listed (`shown`) on the tracked tab.
- Toolbar count, "Move to…" bulk status change, "Untrack N" button and the
  bulk-untrack confirm dialog all use `visibleBulkIds`.
- After an action, only the acted-on ids are removed from the selection;
  selections on rows hidden by a filter stay checked and become actionable
  again when the filter clears (checkboxes already only render for visible
  rows, so the UI stays consistent).

## Non-goals

- No change to single-row actions, status tabs, the R526 filter itself,
  the detail pane, or pipeline storage.
- No URL persistence of bulk state.

## QA plan

- Desktop 1280px: select 4, filter to 1 → toolbar shows "1 selected" /
  "Untrack 1"; untrack removes only the visible row; clear filter → remaining
  3 rows still checked and actionable; "Move to…" respects visibility too.
- 375px: toolbar reachable, zero horizontal overflow.
- Console/error listener installed before assertions; synthetic storage
  cleaned afterwards.
