# R466 — back up an unreadable edit-history list instead of silently destroying it

## Evidence (first-hand, production, CDP — audit-r1/r466_history.py)

Planted a truncated JSON value in `honestcv.resumeHistory` (a checkpoint list holding up
to 15 full resume snapshots — the Builder's edit-history restore points) and merely
loaded `/builder`:

- `listResumeHistory()` parse fails → `[]`.
- The R346 mount-time baseline checkpoint calls `recordResumeSnapshot()` →
  `persistHistory()` rewrites the key with a fresh one-snapshot list.
- Original bytes destroyed. `mount destroyed? True`, backup `None`, alerts `[]`.

Sixth face of the R461–R465 family (draft, copies, documents, pipeline, share links),
and like R465 it is a zero-interaction mount-time destruction path.

## Fix (smallest, same pattern)

- `src/lib/resume.ts`: `stashUnreadableHistory()` — if `honestcv.resumeHistory` exists
  but `JSON.parse` throws or yields a non-array, back the exact raw bytes up to
  `honestcv.resumeHistory.unreadable` (write-once; never overwrite an existing backup)
  and return true. Valid arrays (including ones with invalid entries — the existing
  per-entry sanitize keeps filtering those) return false.
- `persistHistory()` stashes before every write — the single funnel used by
  `recordResumeSnapshot()` (mount baseline, debounced autosave checkpoints, restore
  safety checkpoint).
- `src/pages/Builder.tsx`: `historyUnreadable` state initializer declared before the
  mount-effect that records the baseline; dismissible `role="alert"` bar in the R427
  stacked container: "Your edit history couldn't be read, so it's not shown here.
  The unreadable copy was kept in your browser storage as a backup."

## Rejected

- JSON repair (unsafe, same as R461–R465).
- Alerting inside the History dialog only (destruction happens at mount, before the
  dialog is ever opened; the bar must be visible immediately).

## QA matrix (production)

1. Corrupt history + mount → exact bar copy, exact bytes in backup, rewritten list valid.
2. Existing backup sentinel never overwritten.
3. Valid / missing history → no bar, no backup.
4. Dismiss hides bar only; reload re-shows while corrupt.
5. Coexistence with the R461 draft bar; R462–R465 regressions.
6. 375px light/dark, zero console errors, zero escapes, byte-exact restore.
