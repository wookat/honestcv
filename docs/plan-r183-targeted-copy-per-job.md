# R183 — Targeted resume copy per saved job

## Evidence (Rezi public surface)

Rezi changelog, July 30 2026 — "Automated Targeted Resumes": *"When you save a job,
the system now automatically prepares a targeted version of your resume"* (paired
with Job Tailoring Reports, which we matched in R180). Verified first-hand on
https://www.rezi.ai/rezi-changelog. The protected app remains inaccessible
(OTP 403), so the interaction details below are our own design, not a claim about
Rezi internals.

## Gap today

On `/jobs`, "Tailor resume for this job" calls `targetResume(job)`, which
**overwrites the working draft's** `targetRole` / `targetCompany` /
`jobDescription` and syncs that into whatever saved copy is currently active.
Targeting a second job silently clobbers the first — there is no per-job copy,
and saving a job prepares nothing.

## Design

Local-first, additive:

1. `PipelineEntry` gains optional `resumeVersionId?: string` (jobs.ts), plus a
   `setPipelineVersion(jobId, versionId)` helper. Defensive parsing unchanged.
2. `createResumeVersion(name, data, folder?)` in resume.ts returns the new
   `ResumeVersion` (existing `saveResumeVersion` keeps its signature).
3. Jobs page:
   - Saving a job (status → `saved`) auto-prepares a targeted copy once:
     base = current draft (or empty resume), with the job's title/company/JD as
     target fields; named `"{title} — {company}"`, filed under folder
     `Job applications`; id recorded on the pipeline entry.
   - "Tailor resume for this job" becomes **Open targeted copy**: reuses the
     entry's copy if it still exists (set active version + load its data into
     the draft), otherwise creates it the same way, then navigates to /builder.
     The working draft's own targeting is never clobbered when a copy exists.
   - If the linked copy was deleted on the dashboard, fall back to creating a
     fresh one (stale id replaced).
4. Cover-letter intent and everything else on /jobs unchanged. Zero server
   changes, zero score/export changes. Dashboard folders (R171) make the new
   `Job applications` folder visible automatically.

## Acceptance

- Save job → copy appears on dashboard under "Job applications" with target
  fields + JD set; current draft untouched.
- Open targeted copy → builder shows the copy (active version linked), Target
  job card prefilled; editing autosaves into that copy only.
- Second job → second copy; first copy's targeting intact.
- Deleting the copy then reopening from /jobs recreates it (no crash).
- Unsave keeps the copy (it's the user's document); re-save links a new copy
  only if the old one is gone.
- 1440 + 375 no overflow; R171 folder grouping, R180/R181 smoke intact.
