# R385 — Cover letter flow opens the job's targeted copy instead of clobbering the loaded resume

## Evidence (source, 2026-08-31)

- `targetResume(job, 'cover')` (src/pages/Jobs.tsx) always mutates whatever resume is
  currently loaded: it overwrites `targetRole`/`targetCompany`/`jobDescription` on the
  draft and calls `syncActiveVersion(next)`. If the Builder is bound to a saved copy
  (R381 active-copy architecture) — e.g. the targeted copy for a *different* job — that
  saved copy's target job is silently rewritten by starting a cover letter for job B.
  The confirm dialog only warns "replaces the draft's current target job", never that a
  saved copy gets rewritten.
- The `'target'` intent already does the right thing: `linkedVersion(job.id)` →
  `saveResume(version.data); setActiveVersionId(version.id)` — it binds the editor to
  the job's own targeted copy. Tracked jobs get such a copy automatically on save
  (`prepareTargetedCopy`, R183), so for tracked jobs the cover flow has a correct,
  already-tailored resume available and ignores it.
- R371 set the precedent that per-job artifacts should use the tailored variant when
  `resumeVersionId` is linked (follow-up email body).

## Plan

`src/pages/Jobs.tsx` only — in the `'cover'` branch of `targetResume`:

1. If `linkedVersion(job.id)` exists, open that copy exactly like the `'target'`
   intent (`saveResume(version.data)`, `setActiveVersionId(version.id)`) and navigate
   to the cover deep link. The copy already carries the job's target fields; nothing
   else is mutated, and whatever copy was previously bound is left untouched.
2. Otherwise keep the existing behavior (set target fields on the loaded resume,
   `syncActiveVersion`).
3. Update the cover confirm-dialog description for the has-copy case: the editor opens
   the job's targeted copy; other resumes keep their own target jobs.

## Non-goals

- No change to the no-copy / untracked cover path (documented existing semantics).
- `openInterviewPrep` has the same clobbering hazard; banked as a follow-up round
  rather than widening this diff.
- No change to the R384 coverDocId linking or the Builder tool dialog.
