# R575 — /jobs?attention=1 selects the application that needs the follow-up

## Evidence (production CDP, 2026-08-31)

- Seed: pipeline j1 (Globex, applied, remindOn=2020-01-01, due). Open `/jobs?attention=1`
  (the R574 dashboard deep link): the Tracked queue correctly filters to the Globex row,
  but the desktop detail pane auto-selects the first unrelated feed job (e.g. "Freelance
  Copywriter — Coalition Technologies") — the surface with the follow-up actions
  ("Draft follow-up email", reminder controls) shows a job the user never tracked.
- Cause: `fetchJobs`'s selection fallback is `list[0]?.id` regardless of the attention
  deep link (`Jobs.tsx` ~L229).

## Rezi comparison

Rezi's tracker deep links land with the actionable application in focus; our deep link
names the queue but focuses an unrelated posting.

## Fix (smallest)

`src/pages/Jobs.tsx` only — one-shot ref `seedAttentionSelect` (initialised from
`seedAttention`): in the `setSelectedId` fallback inside `fetchJobs`, when set, select the
first pipeline entry with `staleDays(e) !== null || reminderDue(e)` (same predicate as the
queue filter) instead of `list[0]`; consume the ref so later searches behave as before.
No storage, filter, or copy changes.

## Validation

`npx tsc -b`, `npx eslint src/pages/Jobs.tsx`, `npm run build`, `npm run verify-dist`;
`npx wrangler deploy` (Workers Routes code 10000 expected); production QA 1280+375:
`/jobs?attention=1` detail pane shows the due tracked job (follow-up actions visible),
plain `/jobs` still auto-selects the first feed job, `?job=` deep links unaffected;
restore six-key storage baseline, zero AI quota.
