# R563 — Cover letter flow tracks the job so the letter stays linked to it

## First-hand production evidence (CDP, 1280×900, seeded 1-role draft)
- /jobs?q=react → job detail → "Cover letter" → confirm → generate → "Save to
  My resumes": the doc saves as "Lemon.io — Cover letter", but
  `localStorage['honestcv.jobPipeline']` is still `[]`. The job pane's
  cover-letter link (R384, reads `entry.coverDocId`) can never show it, and
  Tracked stays (0) even though the user wrote a letter for the job.
- Code confirms the root cause: `setPipelineCoverDoc` (jobs.ts:447) only maps
  over existing pipeline entries — a silent no-op for untracked jobs. Builder
  calls it on save (Builder.tsx:10899) with the `job=` id from the URL, but
  Jobs.tsx's cover branch (targetResume, intent==='cover') never tracks the
  job, unlike the target flow (prepareTargetedCopy upserts 'saved' at 532–536).
- Rezi comparison: applications keep their documents attached to the job
  (changelog Aug 2026 "Agent Integration for Resumes" — tailoring/doc state
  stays associated with the job context).

## Fix (minimal, src/pages/Jobs.tsx only)
- In the `intent === 'cover'` branch of `targetResume`, before navigating:
  track the job as 'saved' when untracked (same guard as prepareTargetedCopy):
  `if (!listPipeline().some((e) => e.job.id === job.id) && !applyPipeline(upsertPipeline(job, 'saved'))) return`
- Update the untracked-cover confirm copy to disclose it: append
  "The job is saved to your tracked applications so the letter stays linked
  to it."

## Non-goals
No changes to setPipelineCoverDoc semantics, Builder's save hook, interview
prep flow, target flow, or the job pane's cover-doc rendering.

## Validation
tsc -b, eslint Jobs.tsx, build, verify-dist; deploy (known Workers Routes
code 10000 caveat); production QA 1280/375: cover flow on an untracked job →
pipeline entry 'saved' + coverDocId set after save → job pane shows the
cover-letter link; already-tracked job keeps status; storage restored to the
six-key baseline.
