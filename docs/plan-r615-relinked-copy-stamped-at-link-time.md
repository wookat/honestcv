# R615 — a copy relinked to its job is stamped with `forJob` at link time, not only on the next page load

## Evidence (production, 2026-09-06, bundle index-B1ZMZ9qG.js = R614, qa/r615-evidence.cjs)

Seed: no pipeline; one legacy copy (saved before R614, no `forJob`) targeted at Creative Force / Sales Jedi
(real job 2091088). On `/jobs?job=2091088`:

| step | `relink` (no reload) | `reload` (control) |
| --- | --- | --- |
| Save → R589 reconnects the orphan copy | pipeline links `qa-v1`; copy `forJob: null` | same |
| (reload) | — | `rememberLinkedCopyJobs` on init stamps `forJob: 2091088` |
| Saved chip → "Stop tracking" | pipeline empty; copy **`forJob: null`** | pipeline empty; copy `forJob: 2091088` |

So whether a relinked legacy copy remembers its job depends on whether the user happened to navigate between Save and
Stop tracking. R614 stamps only on page init (/jobs, /dashboard, /builder); every link mutation happens inside the /jobs
page session, and after the untrack the link is gone, so by the R610/R614 rule ("never infer after the link is gone") it
is never stamped later. The dashboard note then falls back to the `?q=<role>` title search R614 set out to retire.

## Change

`src/lib/jobs.ts`

```ts
export function setPipelineVersion(jobId, resumeVersionId): PipelineEntry[] | null {
  const all = listPipeline()
  const saved = savePipeline(all.map((e) => (e.job.id === jobId ? { ...e, resumeVersionId } : e)))
  const job = saved && all.find((e) => e.job.id === jobId)?.job
  if (job) rememberVersionJobs(new Map([[resumeVersionId, { id: job.id, title: job.title, company: job.company }]]))
  return saved
}
```

The link is the one moment the relationship is explicit and live, so stamping there is the same rule as R610/R614, just
not deferred to the next init. `rememberVersionJobs` still only fills a missing `forJob` — a copy that already records
a job keeps it (out of scope: whether linking a copy to a *different* posting should move its provenance; today the only
way that happens is the `copyTargetsJob` heuristic matching a repost with the same title+company). Stamping happens
only after the pipeline write succeeded. All four `setPipelineVersion` callers (Save/status reconnect, cover-letter path,
interview path, `prepareTargetedCopy`) are covered; `prepareTargetedCopy` already stamps at creation so this is a no-op
write-free path for it.

## Validation

qa/r615-evidence.cjs `relink` at 1280 + 375: after Save the copy carries `forJob: 2091088` immediately; after Stop
tracking (no reload) it still does; /dashboard row reads "job no longer tracked — open it to save it again" with
`href=/jobs?q=Sales%20Jedi&job=2091088`. `reload` control unchanged. Storage back to baseline; 0 console errors;
0 AI calls.
