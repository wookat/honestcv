# R249 — Bulk actions on the Tracked applications tab

## Rezi first-party evidence

Rezi's Job Search product page (rezi.ai/job-search, fetched 2026-09-02) advertises under
"Job Tracking → Better organization equals easier job applications":

> "Utility-first bulk actions — Do more, faster. Manage your application tracking in bulk."

alongside stage-based organization ("organize your applications by stage—saved, applied,
interviewing, or rejected").

## Current state (verified in code)

- `src/pages/Jobs.tsx` Tracked tab renders the grouped queue (`trackedQueue`, R196/R247)
  with per-row `<select>` status controls and per-job untrack — strictly one job at a time.
- Moving five stale applications to Rejected, or clearing out a batch of old saved jobs,
  requires five separate row interactions each.
- `src/lib/jobs.ts` only has single-job mutations (`upsertPipeline`, `removeFromPipeline`).

## Design (additive, client-only)

1. `src/lib/jobs.ts` gains two bulk mutations that write the pipeline once:
   - `updateStatuses(ids, status)` — for each matching entry with a different status,
     set status/updatedAt and append to its timeline (same guard as `upsertPipeline`:
     no duplicate consecutive history steps). Entries keep their list position.
   - `removeManyFromPipeline(ids)` — filter out all matching entries.
2. Tracked tab header gains a "Select" toggle (session-only `bulkMode`). In bulk mode each
   row shows a checkbox (`aria-label="Select <title> at <company>"`, click stops propagation);
   row status selects stay functional.
3. When ≥1 selected, an action bar shows "N selected", a "Move to…" `<select>` over the five
   stages, an "Untrack" button (confirm dialog stating the count), and "Clear".
4. Selection clears on tab switch, bulk-mode exit, and after an action.
5. Zero worker/schema/scoring/AI changes; `PipelineEntry` and `honestcv.jobPipeline` unchanged.

## Validation matrix

- Select 3 of 5 tracked jobs, Move to rejected → counts/tabs/grouping update, each moved
  entry's timeline gains exactly one `→ Rejected` step; already-rejected selected entry's
  timeline unchanged.
- Move to the entries' current status → no-op history (no duplicate steps).
- Bulk untrack with confirm; cancel leaves pipeline byte-identical.
- Checkbox click doesn't open the detail pane; row select still works in bulk mode.
- Selection cleared on tab switch/exit; action bar hidden at 0 selected.
- Regression: R247 offer stage, R245 repeated skills bar, R244 chips, per-row select,
  stale nudges, notes/timeline preserved through bulk moves.
- 375px no horizontal overflow; dark-mode contrast on action bar; zero /api/ai/* calls;
  localStorage restored to `["honestcv.clientId","honestcv.qa"]`.
