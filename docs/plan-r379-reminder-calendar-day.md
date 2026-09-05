# R379 — Store follow-up reminders as calendar days, not epochs

## Evidence
R377 stored `PipelineEntry.remindAt` as a ms epoch at the *local midnight of the
device that set it*. Flagged in the R377/R378 QA reports as P3-informational:
after a timezone change (travel, DST edge devices), the same epoch renders as a
different calendar day — a reminder set "for the 15th" in Tokyo shows and fires
as "the 14th" once the user is in SF. A follow-up reminder is semantically a
calendar day ("call them back on the 15th"), not an instant.

## Change (src/lib/jobs.ts + src/pages/Jobs.tsx)
- `PipelineEntry.remindOn?: string` — `yyyy-mm-dd`, no timezone. Replaces `remindAt`.
- `localDayOf(ms)` exported helper; `reminderDue` compares `localDayOf(now) >= remindOn`
  (ISO string compare), so the reminder fires on that calendar day wherever the user is.
- Read-side migration in `sanitizeEntry`: legacy finite `remindAt` numbers convert to
  their local calendar day; malformed `remindOn` values are dropped (R374 pattern).
- `setPipelineReminder(jobId, remindOn: string | null)` validates `^\d{4}-\d{2}-\d{2}$`.
- Jobs UI binds the `<input type="date">` directly to `remindOn` (no epoch round-trip);
  due message renders the day's own components (`shortDay`) — never timezone-shifted.

## Not changed
- Stale-days nudge, attention count semantics, timeline epochs (real instants — correct as epochs).
- No proactive storage rewrite: migration happens on read; the next reminder write persists the new shape.

## Validation
- Oracle `.tmp-smoke/r379_oracle.ts` 12/12 (due today/past/future/none, padding,
  legacy migration, verbatim preserve, malformed drop, setter validate/clear).
- tsc clean, eslint 0 errors (6 preexisting fast-refresh warnings), build green.
- Production QA via testing agent (UTC vs Asia/Tokyo emulation: same calendar day due state).
