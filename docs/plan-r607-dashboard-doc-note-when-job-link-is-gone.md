# R607 — Dashboard document note: "job uses another cover letter" is false when the job's link is gone

## Evidence (production index-B8dU4zi8.js, qa/r607-evidence.cjs)

`/documents`, doc `qa-doc1` (cover, `forJob` = tracked job SRE @ Globex):

| pipeline `coverDocId` | row note |
| --- | --- |
| `qa-doc2` (another existing letter) | `written for Site Reliability Engineer at Globex · job uses another cover letter` |
| `qa-deleted` (dangling — the linked letter was deleted) | *same text* |
| unset | *same text* |

In the last two rows the job uses **no** cover letter; the note asserts one exists. `/jobs` already
tells the truth for the same state (R603: "Cover letter (not linked) · Use for this job").

## Root cause

`Dashboard.tsx` `docTargetNote`: for a `forJob` document that is not linked, it only checks
`trackedJobIds.has(d.forJob.id)` and then always says "job uses another <noun>".

## Fix

```ts
const trackedJobs = useMemo(() => new Map(listPipeline().map((e) => [e.job.id, e])), [docs])
const docIds = new Set(docs.map((d) => d.id))
const linkedDocIdOf = (e: PipelineEntry, kind: CareerDocKind) =>
  kind === 'cover' ? e.coverDocId : kind === 'resignation' ? e.resignationDocId : e.interviewDocId
```
- job tracked and its link for this kind points at an existing doc → `job uses another <noun>` (unchanged)
- job tracked, link unset or dangling → `job has no <noun> linked — use this one` (link → `/jobs?job=<id>`, where R603's "Use for this job" lives)
- job not tracked → unchanged

List row and viewer header share `docTargetNote`, so both change.

## Acceptance

other unchanged; dangling/unset show the new note, link lands on `/jobs?job=qa-j1` whose panel shows
`Cover letter (not linked) … Use for this job`; 1280 + 375 no page overflow; storage restored;
0 console errors; no AI calls.
