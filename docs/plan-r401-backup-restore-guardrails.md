# R401 — Builder backup Restore gets the same guardrails as history Restore

## Evidence (source-verified)

`Builder.tsx` backup `Restore` (hidden file input) replaces the loaded resume the
moment a valid file is picked:

```tsx
setRestoreError('')
linkVersion(null)
setResume({ ...emptyResume(), ...parsed })
```

Two guardrails every comparable destructive path already has are missing:

1. **No confirmation.** Import (dialog), sample load, history Restore, dashboard
   workspace Restore (R400) all confirm before replacing the draft; a single
   mis-picked file here clobbers the loaded resume and detaches the bound copy
   silently.
2. **No pre-restore safety checkpoint.** History Restore (R397) calls
   `recordResumeSnapshot(resume, true)` and refuses to overwrite when the
   checkpoint can't be written. Backup restore relies on autosave snapshots,
   which are skipped inside the 10-minute `HISTORY_MIN_GAP_MS` window
   (`recordResumeSnapshot` early-returns without `force`) — so up to 10 minutes
   of edits can be irrecoverably lost.

## Fix (minimal, Builder.tsx only)

File-pick success path stores the parsed resume in `pendingBackupRestore`
instead of applying it. New confirm dialog ("Restore this backup?" — explains
the loaded resume is replaced and, if bound, the copy stops receiving edits).
On confirm, mirror the history-restore sequence:

```tsx
if (recordResumeSnapshot(resume, true) === null) {
  setStorageAlert(HISTORY_STORAGE_FULL_MSG)   // dialog stays open, draft untouched
  return
}
linkVersion(null)
setResume({ ...emptyResume(), ...pendingBackupRestore })
setPendingBackupRestore(null)
```

Cancel discards the pending file. Invalid-file handling (`restoreError`)
unchanged. Backup button unchanged.

## Non-goals

Changing autosave checkpoint cadence, the backup file format, or the dashboard
workspace restore (R400).

## Verification

- Local: `npx tsc -b`, `npx eslint src/pages/Builder.tsx`, `npm run build`.
- Production QA: valid file → confirm dialog; Cancel leaves draft + binding
  byte-identical; confirm → forced checkpoint recorded, then draft replaced and
  copy detached; storage-full → alert, dialog open, draft untouched; invalid
  file unchanged behavior; 375px light/dark; zero console errors.
