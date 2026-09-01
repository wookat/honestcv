# R190 — Application timeline + per-job notes in the jobs pipeline

## Rezi first-party evidence (public changelog, fetched 2026-09-01)

- 2026-08-21, Rezi Web App: "Streamlined Application Management — We have improved
  the auto-apply drafting process and application queue, making it easier for you
  to track and manage your job applications efficiently."
- 2026-08-20, Auto Apply: "Improved Application Tracking — We have refined the
  application agent cards and tracker interface to provide clearer visibility into
  your active job applications and their current status."

Rezi treats the application tracker as a first-class surface: each application
shows its current status and progression clearly. (Protected app remains
inaccessible — OTP 403 — so the exact tracker UI is unverified; we implement the
publicly evidenced capability, not a clone.)

## Current gap

Our pipeline entry stores only `{ job, status, updatedAt, resumeVersionId }`:

- Changing status overwrites `updatedAt` — the history is lost. You can't answer
  "when did I apply?" once you move to Interviewing.
- There is nowhere to record recruiter names, interview dates, or follow-ups; users
  fall back to external notes.

## Plan (local-first, zero AI, zero Worker, backward compatible)

`src/lib/jobs.ts`:

- `PipelineEntry` gains optional `history?: { status: JobStatus; at: number }[]`
  and `notes?: string`.
- `upsertPipeline` appends `{status, at}` to history when the status actually
  changes (and seeds history on first insert). Existing entries without history
  keep working — display synthesizes one item from `status`+`updatedAt`.
- New `setPipelineNotes(jobId, notes)` persisting trimmed notes.

`src/pages/Jobs.tsx` detail pane (only when the job is tracked):

- "Application timeline" list: chronological status changes with absolute dates
  ("Saved · Aug 30", "Applied · Sep 1"), current step highlighted.
- "Notes" textarea (recruiter, interview dates, follow-ups) saved on change,
  with a subtle saved-state hint. Pipeline tab list rows show a small note dot
  when notes exist.

## Acceptance

- Status transitions accumulate timeline entries; toggling a status off (remove)
  clears the entry entirely (existing behavior).
- Notes persist across reload; stored under existing `honestcv.jobPipeline` key.
- Old pipeline entries (pre-R190) render a one-item timeline without errors.
- 1440 + 375 px, dark mode, no horizontal overflow; R188 tailoring chips intact.
- Zero AI calls, zero schema/Worker changes.
