# R603 — the job card shows earlier documents written for the job (and can relink one when the link is gone)

## Evidence (production `index-CYkh35We.js`, `qa/r603-evidence.cjs`)

Job `qa-j1` (Globex SRE) tracked as *saved*; documents seeded with R602's `forJob` snapshot.

| mode | storage | tracked panel on `/jobs?job=qa-j1` |
| --- | --- | --- |
| dangling | `coverDocId=qa-doc2` (deleted); `qa-doc1` written for this job still exists | `Next step … Application timeline …` — **no cover-letter row at all**, identical to control |
| extra | `coverDocId=qa-doc2`; `qa-doc1` (earlier, same job) also exists | `Cover letter: Globex — Cover letter (2) · Open` — the earlier letter is not mentioned |
| control | no docs for the job | no row (correct) |

So from the job card the user cannot see that a letter for this job exists once the linked one is deleted (the id is intentionally left dangling for Undo — see `linkedDocCount`), and cannot see that more than one letter was written. `/documents` (R602) now labels these ("written for … · job uses another cover letter"), but the job card — the place where you act on the job — stays silent.

## Root cause

`Jobs.tsx` renders one row per kind from `entry.coverDocId / resignationDocId / interviewDocId` only. Documents that know their job (`CareerDoc.forJob`, R602) are never consulted.

## Change (Jobs.tsx only)

```ts
/** Documents written for this job (R602 forJob) other than the one the pipeline currently links. */
const earlierDocsFor = (entry: PipelineEntry, kind: CareerDocKind): CareerDoc[] =>
  listCareerDocs()
    .filter((d) => d.kind === kind && d.forJob?.id === entry.job.id && d.id !== linkedId(entry, kind))
    .sort((a, b) => b.updatedAt - a.updatedAt)
```

For each kind, after the existing linked row (unchanged), render one row per earlier document:

- linked document exists → `Earlier cover letter: <title> · Open`
- no live linked document (id dangling or absent) → `Cover letter (not linked): <title> · Open · Use for this job`
  - `Use for this job` → `setPipelineCoverDoc / setPipelineInterviewDoc / setPipelineResignationDoc(entry.job.id, doc.id)` via `applyPipeline` — an explicit user action, never automatic (R591 stance: no silent link moves).

No change to save semantics, to `/documents`, or to stored data unless the user clicks `Use for this job`.

## Acceptance

- dangling: row `Cover letter (not linked): Globex — Cover letter · Open · Use for this job`; clicking `Use for this job` sets `coverDocId=qa-doc1` and the row becomes the normal `Cover letter: Globex — Cover letter · Open`.
- extra: linked row unchanged + `Earlier cover letter: Globex — Cover letter · Open`; no `Use for this job`.
- control: unchanged.
- interview kind symmetric.
- 1280 + 375: no page-level overflow; storage restored; 0 console errors; no AI calls.
