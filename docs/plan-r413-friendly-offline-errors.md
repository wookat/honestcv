# R413 — remaining API surfaces leak raw "Failed to fetch" when offline

## Production evidence (2026-08-31, cv.zalize.com)
CDP probe: navigate `/jobs?q=engineer` with `/api/jobs/search` failed at the
network layer (`Fetch.failRequest`, simulating offline/flaky connection) —
the jobs board error banner renders the raw browser TypeError message
`Failed to fetch` (screenshot: audit-r412/jobs_offline.png). Not actionable
and inconsistent with the AI helpers (R348) and the shared page (R412),
which show friendly offline copy.

## Source path (code inspection)
Every remaining user-facing fetch that surfaces `err.message` lacks a
network-failure catch, so the raw TypeError text reaches the UI:

- `src/lib/jobs.ts` `searchJobs` → Jobs page error banner.
- `src/lib/checkout.ts` `submitLead` (email gate), `claimTransaction`
  (purchase claim — also an unguarded `res.json()` that can throw a raw
  SyntaxError on a non-JSON reply), `openLemonCheckout` (checkout open).
- `src/lib/license.ts` `activateLicense` (same unguarded `res.json()`).
- `src/lib/resumeCenter.ts` `fetchZalizePrimary`, `fetchResumeProfile`
  (import dialogs).

Already friendly (no change): `api.ts post()`/`fetchAiQuota`,
`checkout.ts fetchBillingStatus`, `resumeCenter.ts zalizeSessionEmail`,
`share.ts` (R395/R412), `pdf.ts` font fetch (bundled asset), examples.json
loaders (silent fallback).

## Fix
Per-call try/catch around `fetch(...)` throwing a friendly, surface-specific
Error ("… — check your connection and try again."), matching the R348/R412
copy pattern; guard the two unguarded `res.json()` calls with
`.catch(() => ({}))` so a non-JSON body falls through to the existing
friendly status-code messages. No behavior change on HTTP error paths —
their existing copy stays byte-identical.

## Non-goals
- No retry/backoff logic; the surfaces already have retryable UI affordances.
- No worker changes.
