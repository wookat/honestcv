# R610 — documents linked before R602 lose their job the moment the link goes

Round: R610. Theme: jobs↔builder↔documents provenance must survive link changes.

## Evidence (production `index-DAnmDytG.js`, `qa/r610-evidence.cjs`)

Seed: tracked job `qa-j1` (SRE @ Globex) with `coverDocId = qa-doc1`, where `qa-doc1` has no
`forJob` (any cover letter / interview brief saved before R602 looks like this).

| step                                                    | /documents note for `qa-doc1`                       |
| ------------------------------------------------------- | --------------------------------------------------- |
| while linked                                            | *(none — R602 note only renders from `forJob`)*     |
| after **Stop tracking** (dialog: "documents lose their link to this job") | "Cover letter · Edited today" — generic |
| after the job links a newer letter (`qa-doc2`)          | "Cover letter · Edited today" — generic             |

While the link exists the app *knows* which job the document is for; it just never writes it down,
so the R602/R607 labels ("job no longer tracked — find it again", "job has no cover letter linked —
use this one") and the R603 "Earlier cover letter · Use for this job" row never apply to any
pre-R602 document. R602 declared this "cannot be backfilled" — that is only true once the link is
already gone.

## Fix (smallest)

`lib/documents.ts`:
```ts
/** Stamp forJob on documents a tracked job links but that never recorded their job (saved before forJob existed). */
export function rememberLinkedDocJobs(pipeline: readonly PipelineEntry[]): CareerDoc[]
```
Persists only when something changed. Called where the relationship is read or about to change:
- `/jobs` and `/dashboard` initial state (`useState(() => …)`), so opening either page backfills;
- `BundleToolDialog` save, before `setPipeline*Doc` replaces the previous link.

No UI change; no behaviour change for documents that already carry `forJob`.

## Acceptance

- legacy: after `/jobs` load `qa-doc1.forJob = qa-j1`; after Stop tracking `/documents` reads
  "written for Site Reliability Engineer at Globex · job no longer tracked — find it again".
- replace: old letter reads "written for … · job uses another cover letter"; `/jobs` card lists it
  as "Earlier cover letter".
- 1280 + 375, no overflow, storage restored, 0 console errors, 0 AI calls.
- `tsc -b`, eslint (changed files), build, verify-dist; deploy; production re-verify.
