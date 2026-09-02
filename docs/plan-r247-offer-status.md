# R247 — "Offer" stage in the job application pipeline

## Rezi first-party evidence

Rezi Job Search user guide (rezi.ai/rezi-docs/job-search):

> "Track your applications: Keep tabs on where you've applied and organize
> opportunities by stage, such as **saved, applied, interviewing, or offer**
> stage."

## Current HonestCV gap

The local pipeline (`src/lib/jobs.ts`) tracks `saved / applied / interviewing /
rejected` only. A user who receives an offer has no stage that represents it —
the timeline (R190), the Tracked overview grouping (R196), the per-status
next-step guidance (R193), and the Hide filter (R195) all stop at
`interviewing`. The best-case outcome of the funnel is unrepresentable.

## Design

Add `'offer'` as a first-class `JobStatus`, ordered between `interviewing` and
`rejected` (funnel order):

- `src/lib/jobs.ts`: extend `JobStatus`, `JOB_STATUSES`, `JOB_STATUS_LABELS`
  (`Offer`). Persistence is additive — existing entries are untouched, and all
  status UI (tabs with counts, per-row status buttons, detail-pane buttons,
  Hide chips, Tracked grouping, timeline) derives from `JOB_STATUSES` /
  `JOB_STATUS_LABELS`, so it picks the new stage up structurally.
- `src/pages/Jobs.tsx`:
  - `counts` gains an `offer: 0` seed.
  - `staleDays` keeps nagging only `applied`/`interviewing` — an offer in hand
    is not a quiet application.
  - `nextStep` gains an offer branch bridging to the existing career-document
    tool: "You have an offer — leave your current role on good terms." with an
    "Open resignation letter" action (`/builder?doc=resignation`), mirroring
    how applied/interviewing bridge to interview prep.
- `src/pages/Landing.tsx`: pipeline blurb mentions the offer stage.

No worker/schema/scoring/AI changes. Legacy pipelines (no `offer` entries)
behave identically.

## Validation

- Mark a tracked job Offer → appears under an "Offer (1)" group on Tracked,
  timeline records the step, detail pane shows the resignation-letter next
  step; applied/interviewing/rejected guidance unchanged.
- Offer entries are excluded from the stale "No update in N days" nudge.
- Hide chips gain an Offer option on the All tab; tab strip gains Offer with
  live count.
- Legacy entries and empty pipeline unaffected; localStorage shape additive.
- 375px, dark mode, R242–R246 regressions.
