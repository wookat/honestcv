# R587 — Untracking a job discloses (and confirms) its targeted resume copy

## Evidence (production CDP, cv.zalize.com, R586 bundle index-CcGhXt2r.js)
- Seeded one tracked `saved` job (SRE at Globex, single history step, no notes, no documents) whose `resumeVersionId` points at the existing copy "Site Reliability Engineer — Globex". /jobs?tab=tracked&job=qa-j1 → toggle "Saved" off. No dialog opened; the pipeline went to `[]` while the copy stayed — the job↔copy link is gone silently.
- Consequence in code (`Jobs.tsx` `setStatus`): re-saving the job runs `!linkedVersion(job.id) && resumeHasContent(...) → prepareTargetedCopy(job)`, i.e. a second "Site Reliability Engineer — Globex (2)" copy is created while the first is orphaned. The user was never told.
- Root cause: the untrack confirmation guard and both untrack dialogs (R582 single, R583 bulk) only count `coverDocId`/`interviewDocId`/`resignationDocId` via `linkedDocCount`; the fourth link, `resumeVersionId`, was never part of the disclosure — even though the dialog copy already promised "Targeted resume copies … stay".
- Dangling ids are otherwise handled: `linkedVersion` and the doc lookups fall back when the target no longer exists, so no broken links render.

## Minimal fix (`src/pages/Jobs.tsx` only)
- `setStatus(job, 'none')` also opens the confirmation when `linkedVersion(job.id)` exists (copy still present).
- Single dialog: add the part `its link to the targeted copy "<name>"`; when a copy is linked the tail becomes "The copy stays on your dashboard, but loses its link to this job; saving it again starts a new targeted copy." (with documents: "The copy and saved documents stay, but lose their link …"). No copy → text unchanged.
- Bulk dialog: count selected entries with a live linked copy; append `plus their link(s) to N targeted resume cop(y|ies)` alongside the document count, tail adjusted for copy/copies (+documents); no links → text unchanged.
- Untrack behaviour itself unchanged: the copy is never deleted.

## Validation
- `npx tsc -b`, `npx eslint src/pages/Jobs.tsx` (0 errors; the pre-existing exhaustive-deps warning at L258 is untouched), `npm run build`, `npm run verify-dist`.
- Deploy: worker + assets uploaded (index-AZ1YhpkC.js / Jobs-CYddL7y0.js); Workers Routes auth code 10000 as known.
- Production QA (`~/qa/r587-evidence.cjs`, traffic marked `honestcv.qa=1`, storage restored to baseline, zero AI quota):
  - 1280 & 375 single untrack with linked copy → dialog opens with the copy name; Cancel keeps pipeline + link intact; scrollWidth == innerWidth.
  - 1280 & 375 bulk "Untrack 2" (one with a copy) → "…plus their link to 1 targeted resume copy. The copy stays on your dashboard, but loses its link to these jobs; saving a job again starts a new targeted copy."
  - 1280 single untrack without copy/notes/history/docs → still untracks immediately with no dialog (behaviour unchanged).
  - 0 console errors in all runs.
