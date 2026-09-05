# R464 — back up an unreadable application pipeline instead of silently destroying it

## Production evidence (first-hand, cv.zalize.com, CDP)

Planted a truncated value in `honestcv.jobPipeline` (the whole application
pipeline — tracked jobs, statuses, timelines, notes, reminders):

```
[{"job":{"id":"j1","title":"Frontend Engineer","company":"Acme"},"status":"applied","notes":"phone screen with
```

- Read side: `/jobs?tab=tracked` shows "Nothing tracked yet" and all tab counts
  as 0 — zero warning, no `[role=alert]`, no backup key. Raw bytes still intact
  after a read-only visit.
- Write side: clicking "Save" on any listed job overwrote the corrupt raw value
  with a rebuilt one-entry list. No backup was created — the user's whole
  pipeline history is destroyed by a single tracking action, without warning.

This is the fourth face of the R461 (draft) / R462 (copies) / R463 (documents)
family: `listPipeline()` conflates missing storage with unreadable storage, and
`savePipeline()` writes without preserving the original bytes.

## Fix (smallest focused change)

`src/lib/jobs.ts`:
- `stashUnreadablePipeline()`: when `honestcv.jobPipeline` exists but is not a
  JSON array, copy the raw bytes to `honestcv.jobPipeline.unreadable` (never
  overwriting an existing backup) and return true. Missing key and valid arrays
  return false with no side effects.
- `savePipeline()` (the single write funnel for upsert/status/notes/reminder/
  version/remove/bulk paths) calls `stashUnreadablePipeline()` before writing.

`src/pages/Jobs.tsx`:
- `pipelineUnreadable` state initialized from `stashUnreadablePipeline()` on
  mount; renders a dismissible `role="alert"` card under the page intro (same
  pattern/copy family as R461–R463). Dismiss only hides the card.

## Rejected alternatives

- JSON auto-repair of truncated values: unsafe, can fabricate data.
- Blocking writes while unreadable: heavier UX, backup already preserves bytes.

## QA matrix

- Corrupt value → alert on /jobs, backup holds exact original bytes.
- Write path (Save on a job without visiting a read surface first) stashes
  before overwriting; existing backup never replaced.
- Valid array / missing key → no alert, no backup.
- Entry-level invalid records still handled by `sanitizeEntry` (R374).
- R461/R462/R463 regressions intact; 375px light/dark, no overflow, no console
  errors, no unintended network traffic; storage restored byte-for-byte.
