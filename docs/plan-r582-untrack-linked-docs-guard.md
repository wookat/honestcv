# R582 — Untrack confirm covers linked documents

## Evidence (production CDP, cv.zalize.com)
- Seeded a tracked job with a linked cover letter (`coverDocId`), single status event, no notes. Setting the status select to "No status" removed the entry instantly — zero dialog, pipeline `[]`. The letter survives in /documents but its job link (R563–R567 loop: pane rows, "for … at …" backlinks, viewer backlink) is silently destroyed.
- Root cause: the `setStatus('none')` guard only checks `entry.notes?.trim() || timelineOf(entry).length > 1`; linked documents (`coverDocId`/`interviewDocId`/`resignationDocId`) don't trigger the confirm, and the dialog copy never mentions them.

## Comparison
Rezi-class trackers confirm before discarding application records with attached materials; silently dropping the association contradicts our own honest-destruction pattern (R191/R462–R467).

## Minimal fix
`src/pages/Jobs.tsx` only:
- Guard adds a linked-doc predicate: any of `coverDocId`, `interviewDocId`, `resignationDocId` set → confirm dialog.
- Dialog description lists the linked-document loss alongside timeline/notes ("its links to N saved documents"), keeping the existing honest phrasing. Documents themselves are never deleted; copy says they stay on /documents but lose their job link.
- Storage, bulk untrack, and all other flows unchanged.

## Validation
- `npx tsc -b`, `npx eslint src/pages/Jobs.tsx`, `npm run build`, `npm run verify-dist`.
- Deploy attempt (`npx wrangler deploy`); Workers Routes auth code 10000 expected — report honestly.
- Production QA at 1280/375: doc-linked entry now confirms with the linked-doc sentence; plain saved entry still untracks silently; notes/timeline paths regress-free; zero overflow; storage restored to the six-key baseline; zero AI quota.
