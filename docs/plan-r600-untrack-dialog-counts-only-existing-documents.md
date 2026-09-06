# R600 — Stop-tracking dialogs count only documents that still exist

## Evidence (production `index-aTQIbJNA.js`, `qa/r600-evidence.cjs`, zero AI)

Seed: tracked job `qa-j1` whose pipeline entry carries `coverDocId: 'qa-doc1'`, but
`honestcv.careerDocs` is empty — exactly the state left behind after the user deletes that cover
letter on `/dashboard` (the id stays so the 10 s Undo can relink it) and the Undo expires.

- `/jobs?job=qa-j1` detail: correctly shows **no** "Cover letter:" line (the lookup at render time
  already checks the doc exists).
- Saved → Untrack: a **confirm dialog opens** and says
  `…deletes its link to 1 saved document. Targeted resume copies and saved documents stay…` —
  the document does not exist; there is nothing to lose and nothing that "stays".
- Bulk Untrack 2 (both entries dangling, 3 ids): `…plus their links to 3 saved documents.`
- Control (doc exists): identical wording, which is correct there.

Root cause: `linkedDocCount(entry)` in `Jobs.tsx` counts the three `*DocId` fields, whereas the
sibling `linkedVersion(jobId)` (R587) only returns a copy that still exists in
`listResumeVersions()`. So the documents half of the disclosure is not "as it is" — it reports
ghosts, and it forces a confirmation on an entry that has nothing else to disclose.

## Fix

`linkedDocCount` resolves the ids against `listCareerDocs()` and counts only those found. All four
consumers inherit it: the untrack gate (`setStatus(job, 'none')`), the single Stop-tracking dialog,
and the bulk Stop-tracking dialog. Dangling ids are left in place on purpose (doc Undo relinks
them; R598 established the same graceful-fallback stance for `resumeVersionId`).

## Acceptance (production, 1280 + 375)

- Dangling single: Untrack removes the job **without** a confirm dialog (no notes / 1 timeline
  step / no copy / 0 existing docs); the pipeline entry is gone.
- Dangling bulk (2 jobs, 3 dangling ids): dialog says timelines and notes only, no "saved
  documents" clause.
- Control (doc exists): wording unchanged (`its link to 1 saved document`).
- No page overflow at 375; storage back to baseline; 0 console errors; 0 AI calls.
