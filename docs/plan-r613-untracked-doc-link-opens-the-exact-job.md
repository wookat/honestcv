# R613 — "job no longer tracked — find it again" opens the exact job, not a title search

## Evidence (production, 2026-09-06, bundle index-nQcfF4AA.js, qa/r613-evidence.cjs)

Seed: no pipeline; one cover letter with `forJob = {id, title: 'Sales Jedi', company: 'Creative Force'}`.

| mode | /documents note | link href | what /jobs shows after the click |
| --- | --- | --- | --- |
| live (`id: 2091088`, posting still online) | `written for Sales Jedi at Creative Force · job no longer tracked — find it again` | `/jobs?q=Sales%20Jedi` | "2 jobs found"; first result (2091088) happens to be selected, so the R612 note appears — by luck of sort order, not by id |
| gone (`id: 1`, posting expired) | identical note and href | `/jobs?q=Sales%20Jedi` | "2 jobs found"; 2091088 *Sales Jedi @ Creative Force* selected, **no** notice that the job the letter was written for is gone, no R612 note (id mismatch). Saving here tracks a different posting and the letter does not relink. |

`/api/jobs/search?q=Sales Jedi` returns `2091088 Sales Jedi` and `2091087 SaaS Product Support Jedi`, both Creative Force — a title search is not an identity.

Meanwhile `/jobs?job=<id>` already resolves a deep link by id (falls back to the unfiltered feed, R5xx) and shows
"The job in that link wasn't found — it may have expired or been removed." when the posting is gone; R612 makes the
selected untracked job disclose its documents and R611 relinks them on Save.

## Gap

The document-side "find it again" link (Dashboard `docTargetNote`, used by /documents rows and the open-document
note) knows `forJob.id` but throws it away and searches by title. Consequences: (1) the user may land on a
look-alike posting and save the wrong one — the letter stays "job no longer tracked" and a duplicate pipeline entry
appears; (2) an expired posting is never disclosed as expired.

The copy-side variants (Builder "Target job" `targetJobUntracked`, Dashboard orphan-copy note) only know
`targetRole`/`targetCompany` from the resume data — there is no job id to link — so `?q=` stays correct there.

## Change (Dashboard.tsx only)

```tsx
- job no longer tracked — <Link to={`/jobs?q=${title}`}>find it again</Link>
+ job no longer tracked — <Link to={`/jobs?q=${title}&job=${forJob.id}`}>open it to save it again</Link>
```

`q` keeps the result list relevant (and shows similar postings when the exact one is gone); `job` selects the exact
posting (→ R612 note + Save relinks via R611) or triggers the existing "wasn't found — expired or removed" alert.

## Validation

qa/r613-evidence.cjs at 1280 + 375: live → URL carries `job=2091088`, exact job selected, R612 note present; gone →
"wasn't found" alert shown, nothing selected as "the" job; no overflow; storage restored; 0 console errors; 0 AI calls.
