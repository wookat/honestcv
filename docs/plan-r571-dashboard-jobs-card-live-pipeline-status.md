# R571 — /dashboard Job search card shows live pipeline status

## Evidence (production CDP, 2026-08-31)

- Seed: pipeline `jt1` (applied, `remindOn` yesterday). /jobs shows "Needs follow-up (1)",
  tracked row "Follow up due", header nav badge "Jobs 1".
- /dashboard (the primary workspace page) has zero application-tracking presence: the
  mobile "Job search" quick-link card shows the static subtitle
  "Remote jobs + your application pipeline" regardless of pipeline state, and no other
  dashboard element mentions tracked applications or due follow-ups.

## Rezi comparison

Rezi's dashboard surfaces the application tracker (August "Improved Application Tracking:
Refined application agent cards and tracker interface for clearer visibility"); our
dashboard treats the pipeline as a dead link even when applications need action.

## Fix (smallest)

`src/pages/Dashboard.tsx` only — compute `trackedCount = listPipeline().length` and
`attention = attentionCount()` (existing helper from `@/lib/jobs`). On the "Job search"
quick-link card, when `trackedCount > 0` replace the static subtitle with
"N tracked application(s)" plus, when `attention > 0`, an amber
"· M need(s) follow-up". Empty pipeline keeps today's copy. No storage, scoring or
navigation changes.

## Validation

`npx tsc -b`, `npx eslint src/pages/Dashboard.tsx`, `npm run build`, `npm run verify-dist`;
`npx wrangler deploy` (Workers Routes code 10000 expected); production QA 375 (card is
md:hidden, mobile-only): live counts render, amber follow-up segment only when due,
empty pipeline shows the static copy, card still navigates to /jobs, zero overflow,
restore six-key storage baseline, zero AI quota.
