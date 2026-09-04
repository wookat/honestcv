# R386 — Interview prep opens the job's targeted copy instead of clobbering the loaded resume

## Evidence (source, 2026-08-31)

- `openInterviewPrep` (src/pages/Jobs.tsx) has the exact hazard R385 fixed for the
  cover-letter intent: it unconditionally overwrites `targetRole`/`targetCompany`/
  `jobDescription` on the currently loaded resume and calls `syncActiveVersion(next)`.
  Under the R381/R382 active-copy architecture, opening interview prep for job B while
  the Builder is bound to saved copy A silently rewrites copy A's target job — with no
  confirm dialog at all on this path ("Open interview prep" next-step button).
- Tracked jobs carry their own targeted copy (`prepareTargetedCopy`, R183) whose
  target fields already point at the job; the `'target'` and (since R385) `'cover'`
  intents bind to it.

## Plan

`src/pages/Jobs.tsx` only — in `openInterviewPrep`:

1. If `linkedVersion(job.id)` exists, bind to that copy (`saveResume(version.data)`,
   `setActiveVersionId(version.id)`) and navigate to `/builder?doc=interview`; nothing
   else is mutated.
2. Otherwise keep the existing draft-mutation behavior.

## Non-goals

- No confirm dialog added (out of scope; the copy-binding path no longer destroys
  anything, and the no-copy path keeps existing semantics).
- No change to interview-prep tooling itself, R384 coverDocId linking, or R385.
