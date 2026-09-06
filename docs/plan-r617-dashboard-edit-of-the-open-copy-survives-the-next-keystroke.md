# R617 — a dashboard "Resume settings" edit of the copy open in the editor is silently undone by the next keystroke

## Evidence (production, 2026-09-06, bundle index-D8wIjRq_.js, qa/r617-evidence.cjs active)

Seed: tracked job SRE @ Globex linked to copy `qa-v1`; the copy is the one the builder is synced to
(`honestcv.activeVersionId = qa-v1`, draft `honestcv.resume` = the copy's data — the state `Open in the editor`
on the dashboard row describes).

| step | copy `qa-v1` (targetRole / company / JD) | draft `honestcv.resume` | dashboard row |
| --- | --- | --- | --- |
| before | SRE / Globex / SRE posting | SRE / Globex / SRE posting | `for Site Reliability Engineer at Globex` |
| Resume settings → Platform Engineer / Initech / Platform posting → **Save** | **Platform Engineer / Initech / Platform posting** | SRE / Globex / SRE posting (unchanged) | `… · now aimed at Platform Engineer at Initech` (R616) |
| /builder: Target role field shows **Site Reliability Engineer**; type one character into Summary | **SRE / Globex / SRE posting** — the edit is gone | SRE / Globex / SRE posting + typed text | `for Site Reliability Engineer at Globex` |

The builder edits the draft and mirrors it into the active copy on every change (`syncActiveVersion(draft)`,
lib/resume.ts). The dashboard dialog writes the copy (`updateResumeVersion`) but not the draft, so the next
keystroke in the editor copies the stale draft's target fields back over the copy. No error, no notice; the ATS
score on the row even flips 61 → 8 → 61. The user reasonably concludes the dashboard edit "didn't stick".

Control (`inactive`): the same edit on a copy that is not the active one persists — `syncActiveVersion` only
touches the active copy.

## Gap

Two writers of the same copy with one-way sync: builder → copy is continuous, dashboard → copy is a one-shot that
the builder never reads back. Every dashboard field that lands in `data` is affected (Target role, Company,
Experience level, Job description); `name` and `folder` are not (they live outside `data`).

## Change (Dashboard.tsx only)

In the Resume settings **Save** handler, after `updateResumeVersion` succeeds, if the edited copy is the active one
(`editing.id === activeId`), apply the same target-field patch to the draft:

```ts
if (editing.id === activeId)
  saveResume({
    ...(loadResume() ?? current.data),
    targetRole, targetCompany, experienceLevel, jobDescription,
  })
```

Patch, not replace: the draft may be a keystroke ahead of the copy (debounced sync); only the four target fields
change. `activeId` is read once on mount (`getActiveVersionId()`), which is how the row already decides to say
"Open in the editor" — the dashboard and the builder are never mounted at the same time in this SPA, so it is
current.

"Save as new copy" (R616) is unaffected: it never writes the active copy.

## Non-goals

- No builder-side "reload the copy if it changed elsewhere" watcher (two-way sync); the dashboard is the only
  other writer of `data`, and it is fixed at the source.
- No change to name/folder (not part of `data`, already persist).

## Validation

qa/r617-evidence.cjs at 1280 + 375, modes `active` / `inactive`:

- active: after dashboard Save the draft carries Platform Engineer / Initech / Platform posting; /builder Target
  role field shows Platform Engineer; after a Summary keystroke the copy keeps Platform Engineer / Initech and gains
  the typed text; builder note reads "tailored to SRE at Globex, but its target fields now point at Platform
  Engineer at Initech" (R616); dashboard row keeps `now aimed at Platform Engineer at Initech`.
- inactive: unchanged behaviour (edit persists, draft untouched).
- No horizontal overflow at either width; storage back to baseline; 0 console errors; 0 AI calls.
