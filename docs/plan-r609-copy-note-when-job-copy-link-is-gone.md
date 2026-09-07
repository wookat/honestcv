# R609 — "tracked job uses another copy" is false when the job's copy link is unset or dangling

Round: R609 (after R608 SOP-10 audit). Theme: jobs↔builder↔documents relationship labels must reflect live state.

## Evidence (production `index-Bk6_OyyT.js`, `qa/r609-evidence.cjs`)

Seed: tracked job `qa-j1` (Site Reliability Engineer @ Globex) and one saved copy `qa-copyA`
whose target role/company/description match the job, but is **not** the job's linked copy.

| pipeline `resumeVersionId` | /dashboard copy note                                   | /builder Target job note                                        | /jobs card (same job)        |
| -------------------------- | ------------------------------------------------------ | --------------------------------------------------------------- | ---------------------------- |
| `qa-copyB` (exists)        | targeted at … · **tracked job uses another copy**      | …but that tracked job uses another copy                          | Open targeted resume         |
| `qa-deleted` (dangling)    | targeted at … · **tracked job uses another copy**      | …but that tracked job uses another copy                          | **Reconnect targeted copy**  |
| unset                      | targeted at … · **tracked job uses another copy**      | …but that tracked job uses another copy                          | **Reconnect targeted copy**  |

Rows 2–3 are false and contradict the jobs board one click away: the job uses *no* copy. This is
the same class of defect R607 fixed for `/documents` ("job uses another cover letter" when the
document link was gone), now on the resume-copy side. It arises naturally: delete the linked copy
(both delete dialogs say the job "loses its copy" and leave the pointer dangling by design), or
track a job with the plain **Track** chip and later target a copy at it by hand.

## Root cause

`CopyTargetNote` (dashboard + builder Copies rows) and `Builder.targetedTrackedJob` only check
"is there a tracked job this copy targets and it is not linked to *this* copy". Neither checks
whether the job's `resumeVersionId` points at a copy that still exists.

## Fix (smallest)

- `CopyTargetNote` gains a `versions` prop; when the matched tracked entry has no
  `resumeVersionId` or it points at no existing version, render
  `tracked job has no copy linked — reconnect it` (same `/jobs?job=<id>` link, where R604 already
  shows "Reconnect targeted copy"). The "uses another copy" wording stays for a live link.
- `Builder` Target job section: same split, using the copy list already in state (`versions`).
  Wording: `This copy is targeted at "…" at …, but that tracked job has no copy linked.` +
  `Reconnect it on the jobs board →`.
- No automatic relinking (R605 principle); the jobs board remains the explicit reconnect point.

## Acceptance

- other (live link to another copy): labels unchanged.
- dangling / unset: dashboard + builder say "has no copy linked — reconnect", link lands on
  `/jobs?job=qa-j1` showing "Reconnect targeted copy".
- 1280 + 375, no page-level overflow, storage restored, 0 console errors, 0 AI calls.
- `tsc -b`, eslint (changed files), build, verify-dist green; deploy; production re-verify.
