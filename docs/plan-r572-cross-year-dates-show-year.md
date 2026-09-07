# R572 — /jobs dates from another year show the year

## Evidence (production CDP, 2026-08-31)

- Seed: pipeline `j1` (applied, `remindOn: 2020-01-01`). /jobs detail pane renders
  "Reminder due Jan 1 — consider following up." — a reminder over six years overdue is
  indistinguishable from one due this coming Jan 1. The same `shortDate`/`shortDay`
  helpers format timeline steps ("Applied · Sep 6") and the tracked-row reminder chip,
  so any cross-year date (e.g. an application from last December) is equally ambiguous.

## Rezi comparison

Rezi's application tracker shows full dates on tracked applications; our pipeline is
long-lived local data where year-crossing entries are the norm, not the exception.

## Fix (smallest)

`src/pages/Jobs.tsx` only — `shortDate(ms)` and `shortDay(day)` append `year: 'numeric'`
to the `toLocaleDateString` options when the formatted date's year differs from the
current year. Same-year dates keep today's compact "Mon D" form. No storage, reminder
logic, or scoring changes.

## Validation

`npx tsc -b`, `npx eslint src/pages/Jobs.tsx`, `npm run build`, `npm run verify-dist`;
`npx wrangler deploy` (Workers Routes code 10000 expected); production QA 1280+375:
2020 reminder renders "Reminder due Jan 1, 2020", same-year timeline steps stay "Mon D",
restore six-key storage baseline, zero AI quota.
