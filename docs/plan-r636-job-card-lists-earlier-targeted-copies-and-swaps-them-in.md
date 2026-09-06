# R636 — Job card lists the other saved copies targeted at the job and lets one be swapped in as the linked copy

Date: 2026-09-06 · Production before: `index-CSKiwVKd.js` (R635) · Evidence: `qa/r634-evidence.cjs … twocopies applied [swap]`

## 1. Evidence (production, real posting 2091088, Applied, copy A linked, copy B also written for the job and unlinked)

```
tracked box: Next step | … | Targeted resume: | Sales Jedi — Creative Force | Open | Application timeline | …
```

B does not appear anywhere on the card. The only places that know about B are the dashboard (R594 note: *tracked job uses another copy — this one stays unlinked*) and the builder Target job section (R605) — both say the job uses another copy and offer nothing. As with documents before R635, the only way to make B the job's copy again is to delete A (then R604 "Reconnect targeted copy" picks B). The copy side of the relationship graph therefore had the same non-reversible gap the document side had.

## 2. Design (`Jobs.tsx`)

```ts
/** Every saved copy targeted at this job that no tracked job links to, newest first. */
const orphanTargetedCopies = (job) =>
  listResumeVersions()
    .filter((v) => !linked.has(v.id) &&
      ((v.forJob?.id === job.id && copyKeepsProvenance(v, pipeline)) || copyTargetsJob(v.data, job)))
    .sort((a, b) => b.updatedAt - a.updatedAt)
```

Rows under the R634 *Targeted resume* row, same shape as the document rows:

- linked copy exists → `Earlier targeted copy: {B.name} · Use this one instead`
- no linked copy → `Targeted copy (not linked): {B.name} · Use for this job` (R604's main button reconnects the first orphan; the rows let the user choose when there are several)

Action = `applyPipeline(setPipelineVersion(job.id, v.id))` — the existing relink (stamps `forJob`, R619). Nothing is deleted or opened; the previously linked copy keeps `forJob` and drops into an *Earlier targeted copy* row with its own swap, so the change is reversible. No *Open* on these rows: opening a copy replaces the editor draft, which is guarded by the confirm dialog behind the main *Open targeted resume* button — swap first, then open.

## 3. Acceptance (production, 1280 + 375)

- twocopies: rows `Targeted resume: A · Open` / `Earlier targeted copy: B · Use this one instead`; click → `resumeVersionId = B`, both copies kept with `forJob = job`, rows swap in place.
- match (single copy): no extra row. No overflow, zero console errors, zero AI calls, storage restored.

## 4. Result

Deployed `index-Cj5uxiAF.js` (Worker upload OK; Routes API code 10000 unchanged). Production QA 1280 + 375: before `Targeted resume: Sales Jedi — Creative Force · Open | Earlier targeted copy: Sales Jedi — Creative Force (2) · Use this one instead`; after click `2091088:applied→copy=qa-copyB`, versions `qa-copyA … forJob=2091088`, `qa-copyB … forJob=2091088`, rows swapped. Control (one copy): no extra row. No overflow (375: 360/375), zero console errors, zero `/api/` calls beyond the job search, storage restored.
