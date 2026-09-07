# R397 — Edit-history checkpoints stop faking success when storage is full

## Evidence (first-party source)

`src/lib/resume.ts`:

- `persistHistory()` wraps `localStorage.setItem(HISTORY_KEY, …)` in a
  try/catch that swallows quota errors (`// storage full / private mode — ignore`).
- `recordResumeSnapshot(data, force)` calls `persistHistory(next)` and then
  unconditionally returns `next.slice(0, HISTORY_MAX)` — callers cannot tell
  whether the checkpoint was actually written.

`src/pages/Builder.tsx`:

- The HistoryDialog copy explicitly promises: *"Restoring saves a checkpoint
  of the current draft first."* The `onRestore` handler does
  `recordResumeSnapshot(resume, true)` and then immediately replaces the
  draft with the snapshot. When storage is full, the safety checkpoint is
  silently dropped and the current draft is overwritten anyway — the exact
  data-loss-with-a-false-promise pattern R392–R396 eliminated elsewhere.
- The autosave path (`useDebouncedSave`) also records checkpoints, but there
  the draft write itself (`saveResume` / `syncActiveVersion`) already turns
  the save chip to "Not saved — storage full" when the quota is hit, so a
  failed periodic checkpoint has honest surrounding signals.

This is the last silent-quota writer in the resume data path after
R392 (documents), R393 (copies), R394 (pipeline), R395 (share records),
R396 (content libraries).

## Fix (smallest change)

`src/lib/resume.ts`:

- `persistHistory(): boolean` — true only when the write landed.
- `recordResumeSnapshot(): ResumeSnapshot[] | null` — `null` only when a
  write was attempted and failed; the dedup / 10-minute-gap early returns
  keep returning the existing list (no write attempted).

`src/pages/Builder.tsx`:

- Restore path: if the forced pre-restore checkpoint returns `null`, do NOT
  restore. Keep the dialog open and show the storage-full alert (reuse the
  R396 fixed-bottom alert), so the promise in the dialog copy stays true.
- Autosave / flush paths: unchanged fire-and-forget (the draft-save chip
  already reports quota failures on this path; a missed periodic checkpoint
  must not block editing).

## Non-goals

- No eviction/compression, no Worker changes, no change to snapshot
  dedup/gap semantics, no history UI redesign.

## Verification

- `npx tsc -b`, `npm run lint`, `npm run build`.
- Production QA: fill storage to zero headroom, open Edit history, Restore →
  alert shown, draft NOT replaced, dialog stays open, `honestcv.resumeHistory`
  byte-identical; free space → Restore works and writes the pre-restore
  checkpoint; R396 library-save alert regression; 375px light/dark.
