# R393 — resume-copy writes stop silently claiming success when storage is full

## Evidence (source, first-hand)
- R351 made the *draft* save honest (`saveResume(): boolean` → "Not saved — storage full" chip)
  and R392 did the same for career documents. Resume copies — the largest objects in storage
  (`honestcv.resumeVersions` holds a full `Resume` per copy, photos included) — still lie:
  `persistVersions` swallows the quota exception and every mutator returns the in-memory array.
- Concretely, with localStorage full:
  - Builder "Save current as copy" / Dashboard save-as-copy / Jobs "Create targeted copy" show
    their success states for a copy that does not exist after reload. Jobs even binds the
    editor to the phantom copy id (`setActiveVersionId(version.id)`) and stores
    `resumeVersionId` in the pipeline entry — dangling references.
  - The Builder autosave state chip reads only `saveResume(resume)`: when the small draft write
    succeeds (same-key replacement) but the much larger linked-copy write in
    `syncActiveVersion` fails, the header says "Saved" while the copy silently diverges.
  - Rename, move-to-folder, duplicate, delete, bulk delete, and undo-restore all show success
    for writes that never happened.

## Fix (client-only, same shape as R392)
- `resume.ts`: `persistVersions` returns a boolean; `createResumeVersion` returns
  `ResumeVersion | null`; `saveResumeVersion` / `renameResumeVersion` / `updateResumeVersion` /
  `duplicateResumeVersion` / `deleteResumeVersion(s)` / `restoreResumeVersion` return
  `ResumeVersion[] | null` (null = nothing written); `syncActiveVersion` returns a boolean
  (true when unlinked/no-op).
- Builder: autosave chip goes to the existing 'error' ("Not saved — storage full") state when
  either the draft save or the linked-copy sync fails; the Copies dialog and save-as-copy paths
  surface a dismissible alert and don't update UI state on failure.
- Dashboard: `applyVersions(next)` helper mirrors R392's `applyDocs`, reusing the same fixed
  bottom `role="alert"` storage bar; folder loops abort on first failure.
- Jobs: failed targeted-copy creation shows the pane error and writes neither
  `activeVersionId` nor the pipeline `resumeVersionId`.

## Non-goals
- History checkpoints (`persistHistory`) stay best-effort: they are rolling snapshots capped at
  HISTORY_MAX, not user-initiated saves; no UI promises success for them.
- No storage-eviction/compression scheme; no worker changes.
