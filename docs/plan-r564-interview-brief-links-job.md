# R564 — Interview prep brief links back to the tracked job

## First-hand production evidence (CDP, seeded 1-role draft)
- /jobs?q=react → track job → status 'applied' → "Open interview prep" →
  Builder dialog → Start from a template → "Save to My resumes": the doc saves
  as "… — Interview prep" (kind interview), but the pipeline entry keys are
  only `job,status,updatedAt,history,resumeVersionId` — no association. The
  job pane can never surface the brief; before the next round the user must
  re-find it by name on /documents.
- Code confirms: openInterviewPrep (Jobs.tsx:609–626) navigates to
  `/builder?doc=interview` with no `job=` param; Builder passes
  `jobId={toolOpen === 'cover' ? toolJobId : ''}` (8512) and the save hook
  only links covers (`kind === 'cover' && jobId`, 10899). PipelineEntry has
  `coverDocId` (R384) but nothing for interview briefs.
- Rezi comparison: application context keeps its documents attached to the job
  (changelog Aug 2026 Week 2 "Agent State Updates" — agent/doc state tracks the
  job's tailoring progress; Jul 30 "Job Tailoring Reports" in-workflow docs).

## Fix (minimal, three files)
- src/lib/jobs.ts: `interviewDocId?: string` on PipelineEntry (sanitize +
  upsert preservation, same shape as coverDocId); add
  `setPipelineInterviewDoc(jobId, interviewDocId)` mirroring
  setPipelineCoverDoc.
- src/pages/Jobs.tsx: openInterviewPrep appends
  `&job=${encodeURIComponent(job.id)}`; job pane renders an
  "Interview prep: <title> · Open" row (same markup as the R384 cover row)
  when `entry.interviewDocId` resolves to a saved doc.
- src/pages/Builder.tsx: pass `toolJobId` for interview too; save hook adds
  `if (kind === 'interview' && jobId) setPipelineInterviewDoc(jobId, doc.id)`.

## Non-goals
No tracking of untracked jobs here (prep only offered on tracked
applied/interviewing entries), no change to cover/resignation flows, the
brief's content, scoring, or storage architecture.

## Validation
npx tsc -b && npx eslint (changed files) && npm run build && npm run verify-dist;
wrangler deploy (Workers Routes code 10000 caveat); production QA at 1280/375:
applied job → Open interview prep → save template brief → job pane shows the
Interview prep row linking /documents?doc=<id>; cover row regression; zero
overflow; storage restored to the six-key baseline.
