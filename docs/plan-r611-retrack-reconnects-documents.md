# R611 — saving a job again reconnects its documents the way it reconnects its copy

Round: R611. Theme: untrack → re-track parity between the targeted copy and the job's documents.

## Evidence (production `index-DW_PgMqc.js`, `qa/r611-evidence.cjs`, real search job 2091088 Sales Jedi @ Creative Force)

1. Track job → job links cover letter `Creative Force — Cover letter` (forJob stamped by R610 on load).
2. Stop tracking. Dialog: "…deletes its link to 1 saved document. Targeted resume copies and saved
   documents stay, but documents lose their link to this job."
3. Save the job again from the results list.

| after re-track                 | copy (R589)                        | documents                                   |
| ------------------------------ | ---------------------------------- | ------------------------------------------- |
| pipeline entry                 | `resumeVersionId` reconnected      | `coverDocId` **unset**                      |
| job card                       | "Open targeted resume"             | primary "Cover letter" button = write a new one; the old letter only in a small "Cover letter (not linked): … · Use for this job" row |

Same recovery gesture, two outcomes. The primary action after re-tracking invites a duplicate
letter; the untrack dialog promises reconnection only for the copy.

## Fix (smallest)

`lib/documents.ts`:
```ts
/** Newest document of each kind written for the job. */
export function latestDocsFor(jobId: string): Partial<Record<CareerDocKind, CareerDoc>>
```
`lib/jobs.ts` `upsertPipeline`: when the job was **not** tracked (`!prev`), seed
`coverDocId / interviewDocId / resignationDocId` from `latestDocsFor(job.id)` — covers all three
tracking entry points (status chip, Target my resume, Cover letter) without touching the UI.
Existing entries are never touched (a job that has a live or dangling link keeps it).

`pages/Jobs.tsx` untrack dialogs (single + bulk): "…stay and reconnect if you save this job again"
replaces "…but documents lose their link". R610 guarantees every currently linked document carries
`forJob` by the time the dialog is shown (the `/jobs` load stamps them), so the promise is true.

Older documents written for the same job stay listed as "Earlier cover letter" (R603) — nothing is
hidden; the newest is chosen exactly as `prepareTargetedCopy` picks the orphan copy.

## Acceptance

- Real job: track → seed linked legacy letter → untrack → re-track: `coverDocId` = the letter again;
  card reads "Cover letter: Creative Force — Cover letter", no "(not linked)" row.
- Dialog text updated (single + bulk); control: a job with no documents reads unchanged.
- 1280 + 375, no overflow, storage restored, 0 console errors, 0 AI calls; tsc/eslint/build/verify-dist.
