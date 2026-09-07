# R579 — Tracked rows show the recorded follow-up

## Evidence (production CDP, cv.zalize.com, 2026-08-31)
- Seeded an applied entry (status change 10 days ago) with `followedUpAt` 1 hour ago (the state right after R576's "Mark as followed up").
- Detail pane timeline shows "Followed up · Sep 6" (R577), but the Tracked queue row shows only "Applied {ago}" — zero follow-up signal.
- Row chips today: amber "No update · Nd" (stale), amber "Follow up due" (reminder due), muted "Follow-up {date}" (upcoming reminder, R573). A completed follow-up renders nothing, so a user scanning the queue cannot distinguish "I followed up 3 days ago" from "nothing ever happened" without opening each pane.

## Comparison
Rezi-class trackers surface last-activity per row; our own queue already surfaces every other follow-up state (stale / due / scheduled) — the completed state is the only invisible one.

## Minimal fix
`src/pages/Jobs.tsx` row chip block only: when `entry.followedUpAt` is defined and later than the last status event (same predicate as R578's email wording), and the row isn't already showing stale/due amber chips, render a muted border chip `Followed up {shortDate(entry.followedUpAt)}` (reuses R572 year-aware formatting). No storage, attention, or pane changes.

## Validation
- `npx tsc -b`, `npx eslint src/pages/Jobs.tsx`, `npm run build`, `npm run verify-dist`.
- Deploy attempt (`npx wrangler deploy`); Workers Routes auth code 10000 expected — report honestly.
- Production QA at 1280/375: followed-up row shows the muted chip; stale row keeps amber "No update" without the chip; entry without followedUpAt renders nothing; zero overflow; storage restored to the six-key baseline; zero AI quota.
