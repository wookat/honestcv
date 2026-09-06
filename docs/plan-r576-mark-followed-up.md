# R576 — Mark as followed up resolves the attention state

## Evidence (production CDP, 2026-08-31)

- Seed: Globex applied 10 days ago with remindOn=2020-01-01 (due). `/jobs?attention=1`
  shows "Follow up due", "No update in 10 days", "Reminder due Jan 1, 2020". Open
  "Draft follow-up email" → dialog offers only Close / Open in email app / Copy email.
  After copying and closing, the entry still shows "Follow up due", still stale, still
  counted in "Needs follow-up (1)" — the follow-up loop has no way to close. The only
  manual out is "Clear reminder", which does nothing for staleness (status-change based).

## Rezi comparison

Trackers let the user log the follow-up so the nudge resolves; ours nags forever until a
status change.

## Fix (smallest)

- `src/lib/jobs.ts`: `PipelineEntry.followedUpAt?: number` (sanitize + upsert preserve);
  `staleDays` counts from `max(lastStep.at, followedUpAt ?? 0)`;
  `markFollowedUp(jobId)` sets `followedUpAt = now` and clears `remindOn`.
- `src/pages/Jobs.tsx`: `followUpDraft` carries `jobId`; dialog footer gains
  "Mark as followed up" (applies `markFollowedUp`, closes the dialog). No filter,
  copy, or storage-key changes.

## Validation

`npx tsc -b`, `npx eslint src/pages/Jobs.tsx src/lib/jobs.ts`, `npm run build`,
`npm run verify-dist`; `npx wrangler deploy` (Workers Routes code 10000 expected);
production QA 1280+375: due+stale entry → draft dialog → Mark as followed up →
amber signals gone, Needs follow-up count drops, reminder input cleared; restore
six-key storage baseline, zero AI quota.
