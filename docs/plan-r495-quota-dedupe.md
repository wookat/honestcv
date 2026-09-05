# R495 — dedupe the duplicate /api/ai/quota request on every workspace route

## Evidence (production, 2026-08-31)

- Lighthouse network log for a cold `/samples` load shows **two** `/api/ai/quota`
  fetches (~699ms and ~717ms, ~857B each). The same double-fetch happens on
  `/dashboard`, `/documents` and `/jobs`.
- Cause: `PlanCard` is mounted twice on every workspace route — once inside the
  desktop `WorkspaceNav` sidebar (`hidden … md:block`) and once as the mobile
  variant (`<PlanCard className="mt-8 md:hidden" />` in `Dashboard.tsx` and
  `Jobs.tsx`). Both instances always mount (visibility is CSS-only), and each
  runs its own `fetchAiQuota()` effect, so every free-plan visit issues two
  identical quota requests.

## Fix

`src/lib/api.ts` only: share the in-flight promise in `fetchAiQuota()` —

```ts
let quotaInFlight: Promise<number | null> | null = null
export function fetchAiQuota(): Promise<number | null> {
  quotaInFlight ??= (async () => { …existing body… })().finally(() => {
    quotaInFlight = null
  })
  return quotaInFlight
}
```

Concurrent callers (the two PlanCards, or PlanCard + Builder) share one network
request; the cache clears as soon as the request settles, so later refetches
(e.g. after consuming AI quota) still hit the network and never show stale
numbers.

## Non-goals

- No response caching / TTL — only in-flight dedupe (quota changes after AI use).
- No component restructuring of PlanCard/WorkspaceNav.
- No change to `/api/billing/status` (fetched once).
