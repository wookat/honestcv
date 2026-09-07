# R577 — Show the follow-up in the application timeline

## First-hand production evidence (CDP, cv.zalize.com)
- Seed an applied entry with `followedUpAt` 3 days ago (post-R576 state: applied 10 days ago, marked followed up).
- /jobs detail pane: no "Followed up" text anywhere (`/[Ff]ollowed up/` on body text: false). The Application
  timeline shows only status changes ("Applied · <date>").
- Consequence: R576's mark honestly suppresses staleness, but the user has no visible record of *when* they
  followed up — the timeline claims nothing happened since applying.

## Competitor comparison
Rezi-class application trackers log activity events (applied, followed up, interviewed) in the job's history,
not just status transitions. Our pipeline already stores the fact (`followedUpAt`), it's just never rendered.

## Fix (minimal, one file)
`src/pages/Jobs.tsx` — Application timeline `<ol>`: merge the status steps with an optional
`{ label: 'Followed up', at: entry.followedUpAt }` event, sorted by time; keep the existing
last-item highlight. No storage, filter, or copy changes.

## Validation
`npx tsc -b`, `npx eslint src/pages/Jobs.tsx`, `npm run build`, `npm run verify-dist`.

## Deploy + QA
`npx wrangler deploy` (known caveat: assets/worker upload succeed, Workers Routes publication fails with
auth code 10000). Production QA at 1280/375: seeded followed-up entry shows "Followed up · <date>" in the
timeline in order; entry without followedUpAt renders unchanged; zero overflow; restore six-key storage
baseline; zero AI quota.
