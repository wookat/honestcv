# R381 — Stop editing a copy: detach the Builder back to a plain draft

## Evidence (first-hand, R380 production audit)

Once the Builder is bound to a saved copy (`honestcv.activeVersionId` set —
after "Save current as copy" or opening a copy), there is no in-Builder path
back to an unbound draft:

- The Copies dialog offers only Open / Rename / Duplicate / Delete on each
  copy; every path keeps or moves the binding.
- The only code paths that clear the binding are loading an example, restoring
  a backup (both replace content) and deleting the active copy.
- The dashboard "Current draft" card mirrors the bound copy's content
  (`honestcv.resume` is the live doc that `syncActiveVersion` writes back), so
  it does not offer an escape either.

Concrete user story: save a copy for job A, keep typing (edits stream into the
copy), then want to make generic edits that should NOT touch the tailored copy
— impossible without deleting the copy or leaving its last state behind via a
second copy.

## Fix (minimal)

Add a "Stop editing this copy" action to the Copies dialog, shown only while a
copy is active. It calls `linkVersion(null)`: the editor keeps its current
content as a plain draft, the copy keeps its last autosaved state, and further
edits stop flowing into the copy. No storage-shape changes; history
checkpoints naturally re-scope to the draft (`versionId: null`) because
`recordResumeSnapshot` reads the live binding.

Footer copy updated so the state is explained next to the action.

## Non-goals

- No dashboard changes (the "Current draft" card mirroring a bound copy is a
  separate labeling question).
- No change to Open/Delete semantics or share-link scoping (`shareScope`
  already follows `linkVersion`).

## Validation

- tsc/eslint/build locally.
- Production QA: bind to a copy, edit (copy syncs), detach, edit again →
  copy unchanged, draft updated; share scope back to 'draft'; history
  checkpoints scoped to draft; button absent when no copy is active; 375px
  light/dark; baseline restore.
