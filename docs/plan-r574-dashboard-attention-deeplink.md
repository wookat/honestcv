# R574 — dashboard follow-up status deep-links to the filtered queue

## Evidence (production CDP, 2026-08-31)

- Seed: pipeline j1 (applied, remindOn=2020-01-01, due) + j2 (applied, no reminder).
  /dashboard Job search card reads "2 tracked applications · 1 needs follow-up" (R571)
  but its href is plain `/jobs` — landing on the default feed, the user must find the
  Tracked tab and the needs-follow-up filter themselves.
- `/jobs?attention=1` (R254) works in production: opens the Tracked queue filtered to
  needs-attention entries (Globex shown, Initech filtered out).

## Rezi comparison

Rezi's dashboard status chips land on the corresponding filtered tracker view; our card
names the actionable state but drops the user at the unfiltered board.

## Fix (smallest)

`src/pages/Dashboard.tsx` only — the Job search quick card's `to` becomes
`/jobs?attention=1` when `trackedAttention > 0`, plain `/jobs` otherwise. No copy,
storage, or pipeline changes.

## Validation

`npx tsc -b`, `npx eslint src/pages/Dashboard.tsx`, `npm run build`, `npm run verify-dist`;
`npx wrangler deploy` (Workers Routes code 10000 expected); production QA 1280+375:
card with due follow-up links to /jobs?attention=1 and click lands on the filtered
Tracked queue; without attention the card still links plain /jobs; restore six-key
storage baseline, zero AI quota.
