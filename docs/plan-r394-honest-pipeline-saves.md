# R394 — job-pipeline writes stop crashing or lying when storage is full

## Evidence (source, first-hand)
- R351/R392/R393 made drafts, career documents, and resume copies honest under quota
  exhaustion. The job pipeline (`honestcv.jobPipeline`) is the last mutable store left:
  `savePipeline` calls `localStorage.setItem` with **no try/catch** (src/lib/jobs.ts:333),
  so at zero headroom every pipeline mutation throws an uncaught exception inside a React
  event handler — tracking a job, changing status, notes blur, reminders, untrack, bulk
  moves. The UI state diverges from storage (React state was often set from the composed
  array before/without the write landing) and the user gets a console error, no feedback.
- Entries carry full `JobListing.description` strings, so the key is easily large enough
  to hit quota (verified in R374/R392 QA seeds).

## Design (same contract as documents.ts/resume.ts)
- `savePipeline(entries): PipelineEntry[] | null` — null when nothing was written.
- All exported mutators (`upsertPipeline`, `updateStatuses`, `removeManyFromPipeline`,
  `setPipelineNotes`, `setPipelineReminder`, `setPipelineCoverDoc`, `setPipelineVersion`,
  `removeFromPipeline`) become `PipelineEntry[] | null`.
- Jobs.tsx gains `applyPipeline(next)` funnelling failures into the R393 fixed-bottom
  `role="alert"` storage bar. Failed writes keep UI state (notes draft kept on failed
  blur-save, bulk selection kept on failed bulk move).
- `prepareTargetedCopy`: failed tracking upsert or version-link write aborts (no
  navigation, no activeVersionId); the already-created copy stays on the dashboard as a
  normal saved copy — honest, no dangling references.

## Non-goals
- Builder's cover-doc back-link (`setPipelineCoverDoc` after first cover save) stays
  fire-and-forget: on failure the link is simply absent (no corruption); the document
  itself already reports its own save failures (R392). Banked for a later round if a
  visible affordance is warranted.
- No storage eviction/compression; no worker changes.
