# R384 — Link cover letters to the tracked job they were written for

## Evidence (source, 2026-08-31)

- `PipelineEntry` (src/lib/jobs.ts) links a tailored resume copy via `resumeVersionId`,
  but has no equivalent for cover letters, even though the /jobs detail pane has a
  dedicated "Cover letter" action (`targetResume(job, 'cover')`) that deep-links to
  `/builder?doc=cover&company=…`.
- After the user drafts and saves that cover letter (`saveCareerDoc('cover', …)` in
  Builder's `BundleToolDialog`), the document and the job have no association: the job
  detail pane cannot show or reopen "your cover letter for this job", and finding it
  again means scanning /documents by title.
- Rezi keeps application documents grouped per job; a per-job link is the missing
  counterpart to the existing `resumeVersionId` link (R183/R251 lineage).

## Change

1. `src/lib/jobs.ts`
   - `PipelineEntry.coverDocId?: string`.
   - `sanitizeEntry` keeps string `coverDocId` (R374 pattern).
   - `upsertPipeline` preserves `coverDocId` across status changes (same as
     `resumeVersionId`/`notes`/`remindOn`).
   - `setPipelineCoverDoc(jobId, coverDocId)` — mirror of `setPipelineVersion`.
2. `src/pages/Jobs.tsx`
   - The cover deep link adds the job id: `/builder?doc=cover&company=…&job=<id>`.
   - Tracked-entry box shows a "Cover letter: <title> · Open" row when the linked
     document still exists; Open navigates to `/documents?doc=<id>`.
3. `src/pages/Builder.tsx`
   - Reads `?job=` alongside the existing `?doc=`/`?company=` params and passes it to
     `BundleToolDialog`; on first save of a cover letter it calls
     `setPipelineCoverDoc(jobId, doc.id)` (no-op when the job is not tracked).
4. `src/pages/Dashboard.tsx`
   - `/documents?doc=<id>` seeds the viewer open on that document; the existing
     `?kind=` URL-sync effect strips the one-shot param after mount.

## Non-goals

- No link from arbitrary /documents docs back to jobs (no picker UI this round).
- Deleting a document does not touch pipeline entries — the row simply disappears
  (dangling ids are harmless and cheap to re-link by drafting again).
- Resignation letters / interview prep briefs are not job-scoped here.
