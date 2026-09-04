# R377 — Per-job follow-up reminders in the application pipeline (banked D2 gap from R368/R372)

## Evidence
- R368 SOP-10 D2 audit and the R372 SOP-04 both banked: "管道无提醒/日期概念（reminder 属独立设计轮）".
  The only nudge today is the fixed 7-day stale heuristic (`staleDays` in src/lib/jobs.ts) — users cannot
  say "the recruiter told me to check back on the 15th". Notes placeholder even prompts for
  "…follow-ups" with nowhere structured to put the date. Job trackers (Rezi tracker, Teal, Huntr)
  ship user-set follow-up dates feeding a due queue.
- Direct source read: `PipelineEntry` has no date field; `attentionCount`/`?attention=1` filter and the
  nav badge are purely stale-driven; R374 `sanitizeEntry` must learn any new field.

## Design (deterministic, no AI, localStorage only)
- jobs.ts:
  - `PipelineEntry.remindAt?: number` (ms epoch, local midnight of the chosen day).
  - `sanitizeEntry`: copy finite-number `remindAt`, drop anything else (R374 rules).
  - `upsertPipeline` preserves `prev.remindAt` across status changes (organizational data, like notes;
    the user clears it explicitly).
  - `reminderDue(entry)`: `remindAt` set and `Date.now() >= remindAt`.
  - `attentionCount` counts entries that are stale OR reminder-due.
  - `setPipelineReminder(jobId, remindAt: number | null)` — null clears.
- Jobs.tsx:
  - Detail pane (next to the timeline/follow-up row): `<input type="date" id="job-remind">` "Remind me"
    + Clear button; due state shows an amber "Reminder due <date>" line.
  - Tracked list rows: amber "Follow up due" chip when the reminder is due (alongside the stale chip).
  - "Needs follow-up" filter (`?attention=1`) includes reminder-due entries.
  - Nav badge converges via the shared `attentionCount`.

## Non-goals
- No notifications/emails/calendar export; no recurring reminders; stale heuristic unchanged;
  future (not-yet-due) reminders don't count as attention.

## Acceptance
- Set a past date → chip + badge + filter include the entry even if updated < 7d ago; clear removes it.
- Future date → no attention; storage round-trips through sanitize; malformed remindAt dropped.
- Oracle .tmp-smoke/r377_oracle.ts green; tsc/eslint/build green; production verification.
