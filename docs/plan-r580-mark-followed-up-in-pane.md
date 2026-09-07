# R580 — Mark as followed up directly from the job detail pane

## Evidence (production CDP, cv.zalize.com, 2026-08-31)
- Seeded an applied entry 10 days stale. Detail pane shows "No update in 10 days — consider following up." with two actions: "Draft follow-up email" and the "Remind me to follow up" date input. Button inventory of the pane confirms zero "Mark as followed up" control.
- The only way to record a completed follow-up (R576 `markFollowedUp`) is the footer button inside the follow-up email dialog. A user who followed up by phone, LinkedIn, or in person must open an email-drafting dialog they don't need just to clear "Follow up due" / "No update · Nd" / "Needs follow-up (N)".

## Comparison
Rezi-class trackers let you log activity on the application directly; forcing the email composer as the only path to log a follow-up is a dead-end for non-email follow-ups.

## Minimal fix
`src/pages/Jobs.tsx` detail pane only: next to "Draft follow-up email" (same `canDraft` block, same button styling), add a "Mark as followed up" button calling `applyPipeline(markFollowedUp(entry.job.id))`. No storage, dialog, or queue changes — the dialog footer button stays.

## Validation
- `npx tsc -b`, `npx eslint src/pages/Jobs.tsx`, `npm run build`, `npm run verify-dist`.
- Deploy attempt (`npx wrangler deploy`); Workers Routes auth code 10000 expected — report honestly.
- Production QA at 1280/375: stale entry → click pane "Mark as followed up" → amber signals clear, Needs follow-up count drops, timeline gains "Followed up", R579 row chip appears; storage restored to the six-key baseline; zero AI quota.
