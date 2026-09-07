# R396 — "Save to library" stops showing a green check when nothing was saved

## Evidence (source, first-hand)
- All 11 content libraries (experience, education, project, involvement, coursework,
  award, reference, certification, publication, skills, summary) persist via
  `persist*Library` in `src/lib/resume.ts`, which **swallowed** quota failures
  (`catch { /* ignore */ }`).
- Every Builder "Save … to library" button called `setXLibrary(saveXToLibrary(...))`
  and unconditionally flipped its icon to a green check for 1.6s — at zero storage
  headroom the user sees success, but the entry was never written and is gone after
  reload. Same silent-fake-success class as R392 (documents), R393 (resume copies),
  R394 (job pipeline).

## Fix (minimal, same pattern as R392–R394)
- `resume.ts`: `persist*Library` returns `boolean`; each `save*ToLibrary` returns
  `Saved*[] | null` (`null` = nothing written). `delete*Library` untouched (removals
  shrink the payload; also read-repair semantics unchanged).
- `Builder.tsx`: each save button applies the result through a guard — on `null` it
  shows a dismissible fixed-bottom `role="alert"` bar ("Not saved to your library —
  your browser storage is full. Free up space and try again.") and does **not** flip
  the green check or touch state. Success paths byte-identical.

## Non-goals
- No storage eviction/compression; no changes to library pickers or delete flows;
  no Worker changes.

## Verification
- `npx tsc -b`, eslint, `npm run build` green; production QA with localStorage filled
  to zero headroom: failed save shows alert + no check + storage byte-identical;
  freed storage saves normally; regressions (R393 copies alert, 375px light/dark).
