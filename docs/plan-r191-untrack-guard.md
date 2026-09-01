# R191 — Guarded stop-tracking in the jobs pipeline

## First-party evidence (Rezi public)
- Rezi changelog 2026-08-20 (https://www.rezi.ai/rezi-changelog): "Improved Application Tracking — We have refined the application agent cards and tracker interface to provide clearer visibility into your active job applications and their current status."
- Rezi changelog 2026-08-21: "Streamlined Application Management — …making it easier for you to track and manage your job applications efficiently."
- Protected app remains inaccessible (OTP 403); evidence is public-surface only.

## Current HonestCV behavior / pain
R190 added a per-job status timeline (`history`) and free-form `notes` to `PipelineEntry`.
But un-tracking is a silent single click along three paths, and it destroys that data:
1. Detail pane: clicking the already-active status button calls `setStatus(job,'none')`.
2. Row "Saved" toggle: clicking it while saved does the same.
3. Row status select: choosing "No status".
All three call `removeFromPipeline(job.id)` immediately — the accumulated application
timeline and notes are deleted with no warning and no undo. R190 production QA flagged
this exact interaction as a data-loss risk (a stray click wiped a test entry).

## Design (minimal, local-first, zero AI / zero Worker / zero schema)
- `Jobs.tsx` only. New state `confirmUntrack: JobListing | null`.
- `setStatus(job,'none')`: if the pipeline entry has meaningful data — `notes` with
  non-whitespace content OR `timelineOf(entry).length > 1` — open a confirm dialog
  instead of removing. Otherwise (fresh entry, one synthesized step, no notes) remove
  immediately as before.
- Dialog (reuse existing shadcn Dialog pattern next to `confirmTarget`):
  title "Stop tracking “{title}”?", description explains the application timeline
  (N status changes) and notes will be deleted; targeted resume copies are kept.
  Buttons: Cancel / destructive "Stop tracking".
- Confirming calls `removeFromPipeline` and clears state. No storage changes.

## Acceptance criteria
1. Entry with notes → any of the three untrack paths opens the dialog; Cancel keeps
   entry, status, timeline, notes intact (row select snaps back to current status).
2. Entry with ≥2 timeline steps and no notes → dialog too.
3. Fresh entry (1 step, no notes) → untrack is immediate, no dialog (unchanged UX).
4. Confirm → entry removed, timeline/notes gone, targeted copy (R183) still on
   dashboard, chip counts update.
5. Legacy pre-R190 entry (no history): 1 synthesized step + no notes → immediate.
6. 1440px + 375px, dark mode, no horizontal overflow; dialog buttons ≥40px touch.
7. Regressions: R188 tailoring chips, R190 timeline/notes flows, status changes
   between real statuses never show the dialog. Zero AI quota.

## Production QA matrix
Desktop 1440 + mobile 375 on https://cv.zalize.com: three untrack paths × (guarded /
unguarded) states, cancel/confirm each, legacy-entry synthesis, dark mode, localStorage
baseline restore ["honestcv.clientId","honestcv.qa"].
