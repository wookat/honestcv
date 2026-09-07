# R614 — targeted copies remember their job (`forJob`), so "find it again" opens the exact posting

## Evidence (production, 2026-09-06, bundle index-QpwmKZEB.js, qa/r614-evidence.cjs)

Seed: no pipeline; one saved copy in *Job applications* targeted at Creative Force (real job 2091088 *Sales Jedi*).

| mode | /dashboard copy note | href | /jobs after the click |
| --- | --- | --- | --- |
| exact (`targetRole: 'Sales Jedi'`) | `targeted at Sales Jedi at Creative Force · job no longer tracked — find it again` | `/jobs?q=Sales%20Jedi` | 2 jobs found; the right one is first by sort order (R604 "Reconnect targeted copy") |
| edited (`targetRole: 'Sales Jedi (EMEA)'` — the user renamed the target in the builder) | same note with the edited role | `/jobs?q=Sales%20Jedi%20(EMEA)` | **0 jobs found — try another search term.** Dead end while the posting is live. |

Documents already carry `forJob` (R602/R610) and R613 uses it to deep-link by id. Copies only have
`data.targetRole/targetCompany/jobDescription`, which the user is free to edit, so the copy-side notes — `CopyTargetNote`
(dashboard copies list, builder "Resume copies" rows) and the builder "Target job" `targetJobUntracked` paragraph —
can only search by whatever the role field says now.

## Change

`src/lib/resume.ts`

```ts
export interface ResumeVersion {
  …
  /** Job the copy was saved for from the jobs board; the data's target fields may be edited later. */
  forJob?: { id: string; title: string; company: string }
}
createResumeVersion(name, data, folder?, forJob?)          // stamps it
listResumeVersions()                                        // keeps forJob only when id/title/company are strings
export function rememberVersionJobs(jobByVersion: ReadonlyMap<string, VersionJobRef>): ResumeVersion[]
                                                            // stamps copies that lack forJob; no-op write when nothing changes
```

`src/lib/jobs.ts`

```ts
/** Stamp forJob on copies a tracked job links but that never recorded their job (saved before forJob existed). */
export function rememberLinkedCopyJobs(pipeline): ResumeVersion[]
```
Same rule as R610 for documents: stamp only while the pipeline link still exists; never infer after the link is gone.
Called where `rememberLinkedDocJobs` is called on init (/jobs, /dashboard) and when the builder loads its copies.

`src/pages/Jobs.tsx` `prepareTargetedCopy` passes `{ id, title, company }` to `createResumeVersion`.

Consumers (`CopyTargetNote`, Builder "Target job"): untracked branch links to
`/jobs?q=<forJob.title>&job=<forJob.id>` with text "open it to save it again" when `forJob` exists, else the current
`/jobs?q=<role>` "find it again". Tracked lookup prefers `pipeline.find(e => e.job.id === forJob.id)` before the
`copyTargetsJob` heuristic. Jobs.tsx `orphanTargetedCopy` likewise prefers an unlinked copy whose `forJob.id` is the
job before the `copyTargetsJob` heuristic — found in production QA: a stamped copy with an edited target role landed
on the exact job via the new link but the panel still said "Target my resume" (would create a duplicate) because the
edited role no longer matched. `copyTargetsJob` itself is unchanged, so legacy copies keep their current matching.

## Validation

qa/r614-evidence.cjs at 1280 + 375: stamped → href carries `job=2091088`, exact job selected with "Reconnect targeted
copy"; stamped-edited (forJob + edited role) → same exact link and "Reconnect targeted copy"; edited/exact (legacy, no
forJob) → unchanged `?q=` fallback; linked-copy stamping: seed a tracked job linking a copy without forJob → after
/dashboard load the stored copy has `forJob`, pipeline bytes unchanged; create: real "Target my resume" on live job
2091088 → the new copy carries `forJob` and the pipeline links it; no overflow; storage restored; 0 console errors;
0 AI calls.

Result (production index-B1ZMZ9qG.js, 1280 + 375): all of the above hold. Legacy copies whose link is already gone
still have no forJob and keep the `?q=` search (honest — nothing on record says which posting they were for).
