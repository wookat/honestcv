# R581 — Tracked row status recency reflects the actual status change

## Evidence (production CDP, cv.zalize.com, 2026-08-31)
- Seeded an applied entry whose history shows `applied` 10 days ago but whose `updatedAt` is now (exactly what a same-status `upsertPipeline` — e.g. the cover/target flows on an already-tracked job — produces). The tracked row renders "Applied today" **and** "No update · 10d" side by side: the status recency label contradicts the stale chip and the detail-pane timeline in the same breath.
- Root cause: the row label uses `entry.updatedAt` (`agoFromMs(updated)`), while `staleDays`/`timelineOf` use the last status-change timestamp.

## Comparison
Rezi-class trackers date the pipeline stage by when the application entered it; a bookkeeping timestamp masquerading as "Applied today" tells the user their application is fresher than it is.

## Minimal fix
`src/pages/Jobs.tsx` only: the per-row recency map takes the last `timelineOf(entry)` step's `at` instead of `entry.updatedAt`. Queue sorting (most recently touched first) keeps using `updatedAt`; storage and detail pane unchanged.

## Validation
- `npx tsc -b`, `npx eslint src/pages/Jobs.tsx`, `npm run build`, `npm run verify-dist`.
- Deploy attempt (`npx wrangler deploy`); Workers Routes auth code 10000 expected — report honestly.
- Production QA at 1280/375: seeded divergent entry shows "Applied 10 days ago" consistent with the stale chip; fresh status change still shows "today"; zero overflow; storage restored to the six-key baseline; zero AI quota.
