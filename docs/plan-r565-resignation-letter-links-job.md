# R565 — Resignation letters link to the offer-stage job

## First-hand production evidence (2026-09-06, CDP, 1280×900)

- Tracked job set to `offer` (pipeline `offer:2091101`); detail pane shows the next-step
  action "Open resignation letter".
- Clicking it navigates to `/builder?doc=resignation` — **no `job=` param**.
- Template path → "Save to My resumes" saves `resignation:Untitled — Resignation letter`
  into careerDocs, but the pipeline entry keys stay
  `job,status,updatedAt,history,resumeVersionId` — no document association.
- The jobs detail pane has no affordance to reopen the resignation letter written for
  that offer; cover letters (R384/R563) and interview prep briefs (R564) are both linked.

## Root cause

Same three-point loss as R564's interview gap:
1. `Jobs.tsx` `nextStep` offer branch: `navigate('/builder?doc=resignation')` drops the job id.
2. `Builder.tsx` forwards `toolJobId` only for cover/interview dialogs.
3. `PipelineEntry` has `coverDocId`/`interviewDocId` but no resignation field, and the
   save hook only links cover/interview docs.

## Rezi comparison

Rezi keeps application context attached across related documents in its application
workflow (job tailoring reports, agent cards, tracker). HonestCV now preserves job
context for targeted resumes, cover letters and interview briefs; the resignation
letter written when a tracked job reaches `offer` is the one remaining document that
silently loses its origin.

## Fix (smallest valuable change, mirrors R564)

1. `src/lib/jobs.ts`: `PipelineEntry.resignationDocId?: string`; preserve through the
   sanitizer and `upsertPipeline`; add `setPipelineResignationDoc(jobId, docId)`.
2. `src/pages/Jobs.tsx`: offer branch navigates to
   `/builder?doc=resignation&job=<id>`; detail pane renders a
   `Resignation letter: <title> · Open` row (same markup as the cover/interview rows).
3. `src/pages/Builder.tsx`: forward `toolJobId` for the resignation dialog; save hook
   calls `setPipelineResignationDoc` for `kind === 'resignation'`.

## Non-goals

- No change to resignation letter content/generation, cover/interview linking, ATS
  scoring, persistence architecture; no new job tracking side effects (offer entries
  are already tracked); no real AI usage/payments/leads.

## Validation

- `npx tsc -b`; `npx eslint src/lib/jobs.ts src/pages/Jobs.tsx src/pages/Builder.tsx`;
  `npm run build`; `npm run verify-dist`.
- `npx wrangler deploy` (expect known Workers Routes auth code 10000; assets+worker upload).
- Production QA at 1280/375: offer job → Open resignation letter → Builder dialog with
  job context → template path save → pipeline `resignationDocId` set → detail pane row
  renders and Opens the doc; cover/interview rows regression; zero overflow; restore the
  six-key storage baseline.
