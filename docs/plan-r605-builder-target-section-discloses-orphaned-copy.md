# R605 — Builder "Target job" section discloses an orphaned targeted copy (job uses another copy / job no longer tracked)

## Evidence (production index-DRUZwNMy.js, qa/r605-evidence.cjs)

Editing a saved copy in the builder (`activeVersionId = qa-copyA`, targeted at "Site Reliability
Engineer" at Globex):

| seeded state | Target job section note |
| --- | --- |
| pipeline links copy A | `This copy is tailored to "Site Reliability Engineer" at Globex. View it on the jobs board →` |
| pipeline links copy B (same job) | *(none)* |
| job not tracked | *(none)* |
| standalone draft, no target | *(none)* |

So a copy that targets a tracked job but is not the copy that job uses, and a copy whose job was
untracked, look exactly like an ordinary draft in the editor — even though the dashboard (R593/R594)
and the builder's own Copies dialog (R599) already label both cases via `CopyTargetNote`.

## Root cause

`Builder.tsx` `linkedJob` only searches `listPipeline()` for `resumeVersionId === activeVersionId`;
the section renders the note only for a live link.

## Fix

```ts
const targetPipeline = useMemo(() => (activeVersionId ? listPipeline() : []), [activeVersionId, versions])
const targetedTrackedJob = useMemo(
  () => activeVersionId && !linkedJob ? targetPipeline.find((e) => copyTargetsJob(resume, e.job)) : undefined,
  [...])
```

Target-job section:
- `linkedJob` → unchanged.
- `targetedTrackedJob` (job tracked, uses another copy) →
  `This copy is targeted at "<title>" at <company>, but that tracked job uses another copy. View it on the jobs board →`
- else, editing a copy with `targetRole` and `jobDescription` non-empty and no tracked match →
  `This copy is targeted at "<role>" at <company> — that job is no longer tracked. Find it again →` (`/jobs?q=<role>`)
- standalone draft → unchanged (no note).

Disclosure only; no relinking from the editor (the jobs board's confirm dialog stays the explicit
reconnect path, R589/R590/R604).

## Acceptance

linked unchanged; other/untracked show the respective note with working link; draft unchanged;
1280 + 375 no page overflow; storage restored; 0 console errors; no AI calls.
