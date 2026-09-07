# R409 — workspace restore drops a dangling activeVersionId

## Evidence (production audit, 2026-08-31)
Exploratory audit across letter generation, interview practice, import chains and
cross-tab/theme/a11y found zero P0–P2. Confirmed P3: restoring a workspace backup
whose `honestcv.activeVersionId` matches no version in the backup succeeds silently
and the stale key persists after loading /builder — the builder edits the draft with
no "Editing …" attribution and nothing repairs the pointer until the next autosave
happens to run `syncActiveVersion`. `/jobs` repairs bogus ids on load (R407 precedent);
restore does not. Evidence: `r409_c4_restored.png`, `r409_c4_builder_orphan.png`.

Banked P4: corrupt-PDF import shows the raw pdf.js string "Invalid PDF structure."
(safe behavior, un-branded copy) — future round.

## Fix (workspace.ts only)
After a successful restore, drop the link when it dangles:
```ts
function danglingActiveVersion(data): boolean
// active id set, but honestcv.resumeVersions in the backup contains no version
// with that id (unparseable versions count as dangling)
...
if (danglingActiveVersion(data)) localStorage.removeItem('honestcv.activeVersionId')
```
Valid links restore unchanged; backups without the key are untouched; rollback path
untouched.

## Validation
Local: `npx tsc -b`, `npx eslint src/lib/workspace.ts`, `npm run build`.
Production QA: dangling-id backup → key absent after restore, builder loads as plain
draft; valid-id backup → key preserved and builder shows "Editing <name>"; no-key
backup unchanged; storage-full rollback regression; zero escapes; baseline restore.
