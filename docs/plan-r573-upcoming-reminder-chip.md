# R573 — tracked rows show upcoming follow-up reminders

## Evidence (production CDP, 2026-08-31)

- SOP-10 rescan: 7 routes × (1280, 375) — zero horizontal overflow, storage baseline intact.
- Seed: pipeline `j1` (applied, `remindOn: 2027-03-15`, not yet due). The /jobs detail pane
  shows the date only inside the `<input type="date">`; page text never mentions the
  scheduled follow-up. Tracked rows render chips only for `staleDays` ("No update · Nd")
  and `reminderDue` ("Follow up due") — a scheduled-but-not-due reminder produces zero
  signal in the queue, so the user cannot scan which applications already have follow-ups
  planned versus which are unmanaged.

## Rezi comparison

Rezi's tracker surfaces upcoming follow-up dates on tracked applications; our reminder is
invisible until the day it fires.

## Fix (smallest)

`src/pages/Jobs.tsx` only — in the tracked-row chip block, when `entry.remindOn` is set
and not due, render a muted chip `Follow-up {shortDay(entry.remindOn)}` (border style,
not amber — amber stays reserved for needs-attention states). `shortDay` is R572
year-aware, so cross-year reminders read "Follow-up Mar 15, 2027". No storage, reminder
logic, or scoring changes.

## Validation

`npx tsc -b`, `npx eslint src/pages/Jobs.tsx`, `npm run build`, `npm run verify-dist`;
`npx wrangler deploy` (Workers Routes code 10000 expected); production QA 1280+375:
upcoming reminder chip on the row, due reminder still amber "Follow up due", no chip
without a reminder, restore six-key storage baseline, zero AI quota.
