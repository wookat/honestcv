# R145 — Persistent "Sort by date" toggle for Experience & Education

## Audit evidence (Rezi, live DOM, 2026-08-31)

Rezi's Experience and Education pages show a persistent **"Sort by date"
switch** in the left entry-list panel (first-hand DOM on
`/dashboard/resume/<id>/education` and `/experience`). While the switch is on,
the entry list stays date-sorted — new and re-dated entries fall into place
automatically; the user never has to re-trigger a sort.

RezUp has the one-shot "Sort by date" buttons (R86: `sortEntriesByDate` —
newest first, ongoing on top, undated keep relative order at the end) on
Experience and Education, but the order drifts as soon as the user adds an
entry or edits a date, and they must remember to press the button again.

## Design

- `Resume` gains `autoSortByDate?: ('experience' | 'education')[]` — sanitizer
  keeps only these two keys, deduplicated. Absent/empty = off (today's
  behavior). Zero new storage keys.
- Builder: the existing one-shot button becomes a toggle (`aria-pressed`,
  Eye-style pressed state via `variant` swap): turning it **on** sorts the
  section immediately *and* records the key; turning it **off** just removes
  the key (order stays as-is — nothing is lost).
- While on, a `useEffect` keeps the invariant: whenever the section's id order
  differs from its `sortEntriesByDate` order, `setResume` re-sorts (compares
  id sequences to avoid loops; a single normalize pass per change). Adding an
  entry or editing dates therefore re-files the entry automatically. Manual
  drag while on also snaps back — same as Rezi's switch semantics.
- Sorting mutates the stored array through `setResume`, so undo/redo and
  autosave treat it as an ordinary edit; exports/preview need no changes
  (they render array order).
- Drag handles stay enabled (a drag simply gets re-sorted); no disabled state
  to explain.

## Non-goals

- No auto-sort for other sections (Rezi's switch exists on Experience,
  Education and similar dated lists; ours starts with the two that already
  have the one-shot button).
- No change to `sortEntriesByDate` semantics.

## Verification

Local lint/build; deploy; production 1440+375: toggle on sorts immediately and
persists across reload; adding an out-of-order entry auto-files it; editing a
date re-files; drag while on snaps back; toggle off freezes current order and
allows manual drag; undo steps through sort states; R144 gating and R143
regressions; 375px toggle reachable, no overflow.
