# R20 — Jobs board: row-level quick actions + pipeline timestamps

Date: 2026-08-29 · Round: R20 · Status: planned

## Evidence (first-hand, 2026-08-29)

Rezi Job Search (`app.rezi.ai/dashboard/job-search`, logged-in capture in
`~/audit-r1/shots-r19/app-job-search.{png,txt}`): every job row in the list
carries two inline quick actions — **"Add to Saved"** and **"Change status"**
— usable without opening the job detail. Rows also show a relative age
("4 days ago").

RezUp `/jobs` today (post-R19): the list rows show title/company/location/
posted-age/status tag, but saving or changing status requires opening the
detail pane and using the status buttons there. Pipeline tabs show the job's
original posted date, not when the user saved/updated it.

## Gap (P1, 操作台 workspace dimension)

Tracking a batch of jobs currently costs one detail-pane round-trip per job.
Rezi's board is one click per row.

## Scope

1. **Row-level Save toggle** — a small "Save"/"Saved" button on each list row
   (all tabs). Clicking toggles `saved` status via existing
   `upsertPipeline`/`removeFromPipeline`; `stopPropagation` so the row click
   still opens the detail.
2. **Row-level status select** — a compact `<select>` on each row with
   None/Saved/Applied/Interviewing/Rejected, mirroring the detail-pane status
   buttons (same `setStatus` semantics; "None" removes the entry).
3. **Pipeline timestamps** — on pipeline tabs (Saved/Applied/…), rows show
   the entry's `updatedAt` as "Saved 2 days ago" / "Applied today" instead of
   only the job's posted age. `PipelineEntry.updatedAt` already exists — no
   storage change.

## Architecture

No Worker/API/storage changes. Pure `src/pages/Jobs.tsx` UI batch reusing
`upsertPipeline` / `removeFromPipeline` / `statusOf` / `postedAgo`.

## Out of scope

- Per-job notes/reminders (no Rezi evidence of such a feature on the board).
- Matched tab / match scores (unchanged R19 decision — no honest model).
- Cloud pipeline sync (architecture decision, requires approval).

## Acceptance

- Toggle Save from a row without opening detail; tab counts update live.
- Change status from the row select; detail-pane buttons stay in sync.
- Row click (outside the controls) still opens detail; mobile unaffected.
- Pipeline tabs show relative status timestamps.
- 375px: controls ≥40px touch targets, no horizontal overflow.
- lint / tsc / build green locally; production QA at 1440 + 375.
