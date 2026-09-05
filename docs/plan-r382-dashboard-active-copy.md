# R382 — Dashboard becomes active-copy aware

## Problem (first-hand evidence)

Since R366/R381 the Builder tracks a bound saved copy via `honestcv.activeVersionId`
(`syncActiveVersion` streams every autosave into the copy). The Dashboard, however,
was completely blind to that binding — it only reads `honestcv.resume` (the draft
mirror) and `honestcv.resumeVersions`:

- While a copy is bound, the "Current draft" card shows the exact same content and
  ATS score as the bound copy's card — two identical cards, one mislabeled
  "Current draft".
- "Save as copy" on that draft card (and the "Keep a copy of my current draft"
  checkbox in the New-resume dialog, and the "Save draft as copy, then open"
  buttons) create a *duplicate* of a copy that is already saved.
- The Open confirmation ("This replaces what's currently in the editor. Save the
  current draft as a copy first…") warns about data loss that cannot happen: while
  bound, the current work is already persisted in the bound copy.
- Nothing on the dashboard indicates *which* copy the editor is currently editing.

Verified in source (`Dashboard.tsx` never imported `getActiveVersionId`) and via the
Builder/Jobs flows that set the binding (`openCopy`, `targetResume`).

## Fix (Dashboard.tsx only)

Read `getActiveVersionId()` once on mount and derive `activeCopy` from the live
versions list (so a deleted bound copy naturally degrades to the unbound view):

- Hide the standalone "Current draft" card while a copy is bound — the copy card
  *is* the live content.
- Append "· Open in the editor" to the bound copy's meta line (grid card + list row).
- Opening another copy while bound skips the replace-confirmation dialog (no data
  can be lost) and just opens it.
- New-resume dialog: hide the keep-a-copy checkbox while bound and never
  double-save in `startNewResume`.
- Import confirmation: while bound, say the work is already saved to the bound copy
  and hide the duplicate-creating "Save draft as copy, then open" button.

## Non-goals

- No storage-shape changes; `activeVersionId` semantics unchanged.
- Builder/Jobs binding flows untouched.
- Bulk actions, folders, search untouched (bound copy remains fully manageable;
  deleting it is still allowed — Builder unlinks on its next save, as before).
