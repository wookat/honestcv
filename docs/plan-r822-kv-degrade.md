# R822 — The Worker degrades truthfully when KV is unavailable instead of answering 500

Chain: R821 (#1039) → this PR.

## Question this round answers

R821's production QA found `/api/ai/quota` (with a valid `x-client-id`), `/api/jobs/search`,
`/api/share/:id` and `/s/:id` all answering **500 Internal Server Error** while `/api/health` was
200. `wrangler tail` showed the cause on every one of them:

```
KV get() limit exceeded for the day.
```

This round asks: which user-facing paths break when the KV binding throws, and what is the
truthful answer for each one — without inventing a share record, a quota count, a cached job
list or a page that does not exist?

## Evidence

### Production (before the fix)

| request | status | body |
|---|---|---|
| `GET /api/ai/quota` (`x-client-id`) | 500 | `Internal Server Error` (text) |
| `GET /api/jobs/search?q=engineer` | 500 | `Internal Server Error` |
| `GET /api/share/nonexistent123` | 500 | `Internal Server Error` |
| `GET /s/nonexistent123` | 500 | `Internal Server Error` |
| `GET /api/health` | 200 | `{"ok":true,"llmConfigured":true}` |

`wrangler tail --format json`: every failing request logs `KV get() limit exceeded for the day.`

### Why the cap is hit

Cloudflare GraphQL `kvOperationsAdaptiveGroups` for the account, 2026-09-03 → 09-09: **420 k –
650 k KV reads/day** account-wide; `HONESTCV_KV` itself does **1 – 4 k reads/day**. The reads
come from other Workers on the same account (`watchdeck` → namespace `CACHE`, 200–320 k reads +
130–230 k writes/day; `linkshop-edge` → `STORE`, 180–300 k reads/day). The runtime error plus the
usage split support "a shared account-wide daily read cap is exhausted by traffic that is not
ours"; the exact cap is Cloudflare's free-plan figure and was not re-verified against billing
documentation this round (inference, labelled as such). Once the cap is hit, the binding throws
on **every** read for the rest of the UTC day, so RezUp's KV-backed routes were down for hours a
day regardless of RezUp's own traffic.

### Who reads KV (code audit of `worker/index.ts`)

| path | KV use | consequence of an unhandled throw |
|---|---|---|
| `GET /api/ai/quota` | read `quota:*` | 500 → client already treats a failed quota fetch as "unknown" (no count), so the Builder QA in R821 was not blocked, but the endpoint itself was a 500 |
| `POST /api/ai/*` middleware (unlicensed) | read per-client + global counters, `put` rate-limit keys | 500 **before** the model is called; the user sees a generic failure |
| `consumeFreeQuota` after a successful AI reply | read + put | the reply the user waited (and the model was paid) for is thrown away as a 500 |
| `GET /api/jobs/search` | read/put per-query payload cache + shared feed snapshots (R722 / R762) | 500 — jobs board empty with a generic error, although every upstream board was reachable |
| `GET /api/share/:id` | read `share:*` | 500 — indistinguishable from "our server is broken"; client said `Loading the resume failed (500)` |
| `GET /s/:id` shell (`app.notFound`) | read `share:*` for `<title>` / description | **500 for the whole page** — no app shell at all, so the client could not even show a retry |
| licences, checkout, webhooks, analytics, share create/delete | read / put / delete | 500 |

## Options

| option | verdict |
|---|---|
| Wrap every KV call in one typed error and degrade route by route: quota → `null`; free-AI gates → fail **closed** with a 503 that says nothing was spent; jobs → Cache API shadow, then live upstream; share API → 503 "not a revoked link"; `/s/:id` → app shell without the KV meta; everything else → 503 JSON with `Retry-After` from `app.onError` | **chosen** |
| Fail **open** on the free-AI gates when the counters are unreadable | rejected — the counters exist to cap model spend per client and globally; an outage that lasts the rest of the day would remove the cap for hours |
| Fabricate a "share not found" (404) when the KV read fails | rejected — tells the owner their link was revoked when it was not; the client's "gone" state must stay reserved for a real miss |
| Serve shares from a Cache API copy when KV fails | rejected for now — a `caches.default` copy is per data centre and would only exist for shares read from that colo earlier in the day; it would make "works in Frankfurt, 503 in Chicago" the observable behaviour, and shares are revocable (a stale copy after delete is worse than a truthful 503) |
| Move the job caches off KV entirely (Cache API only) | rejected — the Cache API is per colo, so every colo would hit the upstream boards once per query per TTL; KV stays primary and the Cache API is a shadow that answers only when KV cannot |
| Pay for Workers Paid / fix the other Workers | correct and **outside this repo** — resource request to the boss stays open (see R821 handoff); this PR makes RezUp survive the shared cap either way |

## Fix (`worker/index.ts`, `src/lib/share.ts`)

```ts
class KvUnavailableError extends Error { constructor(op: 'get' | 'put' | 'delete', key: string, cause: unknown) … }
async function kvGet(env, key)            // env.KV.get wrapped; logs `KV get quota:* failed: …`, throws KvUnavailableError
async function kvPut(env, key, value, o?) // same for put
async function kvDelete(env, key)         // same for delete
```

Every `c.env.KV.get / put / delete` in the Worker now goes through the wrappers (mechanical
replacement; behaviour with a working KV is unchanged — same keys, values, TTLs).

Route-level degradation:

- `GET /api/ai/quota` → `200 { freeRemaining: null }` + `Cache-Control: no-store` on
  `KvUnavailableError` (the same shape an anonymous request gets; the client shows no count).
- `POST /api/ai/*` middleware (free tier only; a licensed request never touches KV here): any of
  the three counter reads / rate-limit writes failing → **503**
  `{ error: "Free AI is paused for a few minutes — usage tracking is offline on our side. None of your free uses were spent; please retry shortly.", code: "unavailable" }`,
  `Retry-After: 300`, `Cache-Control: no-store`. The model is not called.
- `consumeFreeQuota()` → `Promise<number | null>`: `null` when the post-reply bookkeeping could
  not be recorded; the AI reply is still delivered and `freeRemaining: null` is returned instead
  of a fabricated count. (The old `-1` sentinel for "exhausted / no client id" became `0`; the
  only caller clamped with `Math.max(…, 0)` before, so the wire value is the same.)
- `GET /api/jobs/search`: `readShadowedCache()` reads KV first and, only after a
  `KvUnavailableError`, `caches.default.match()` of a synthetic same-zone key
  (`https://kv-shadow.cv.zalize.com/<encoded kv key>`); `writeShadowedCache()` writes KV **and**
  the shadow through `executionCtx.waitUntil(Promise.allSettled(…))` so a failing KV put never
  fails the response. Feed snapshots (R722 / R762) and the assembled per-query payload both use
  it. With no shadow and dead upstreams the existing 502 sentence is unchanged.
- `GET /api/share/:id` → **503**
  `{ error: "Loading shared resumes is temporarily unavailable on our side — please retry in a few minutes. This is not a revoked link.", code: "unavailable" }`,
  `Retry-After: 300`. A KV read that *succeeds* and returns nothing is still the 404 "gone" path.
- `GET /s/:id` (`app.notFound` shell): the metadata read is wrapped; on `KvUnavailableError` the
  shell is served with **200**, generic shared-resume `<title>` / description, `Cache-Control:
  no-store`, `X-Robots-Tag: noindex`, so the client mounts `SharedResume`, calls
  `/api/share/:id`, and shows the server's message with **Try again**. A readable miss is still
  the honest 404 shell.
- `app.onError`: `KvUnavailableError` → **503**
  `{ error: "This is temporarily unavailable on our side — please retry in a few minutes.", code: "unavailable" }`
  + `Retry-After: 300` + `no-store` for every other KV-backed API route (licences, checkout,
  webhooks, share create/delete …); other errors → 500 JSON for `/api/*` (was a bare text 500)
  with the stack in the tail.
- `src/lib/share.ts`: a 5xx from `/api/share/:id` is parsed for `{ error }` and that sentence is
  thrown, so `SharedResume`'s existing `error` state (with **Try again**) shows it verbatim
  instead of `Loading the resume failed (503). Try again.`

Not changed: `SharedResume.tsx` state machine (already had `loading` / `gone` / `error` /
`ready`), `src/lib/api.ts` (already surfaces `data.error` for non-OK AI responses), quota UI (already
treats `null` as "unknown").

## Tests (`tests/worker-kv-degrade.test.ts`, 291 → 299)

Runs the real Worker (`worker.fetch`) against a `brokenKv()` whose every method rejects with the
production error string, a `memoryKv()` for the normal path, a fake `ASSETS.fetch` (index / spa
shell), a fake `caches.default` and a fake `ExecutionContext`; upstream boards are `vi.fn` fetch
mocks.

1. `/api/health` stays 200 with broken KV.
2. `/api/ai/quota`: broken KV → 200 `{ freeRemaining: null }` + `no-store`; readable KV → `{ freeRemaining: 12 }`.
3. Unlicensed `POST /api/ai/rewrite` with broken KV → 503, `Retry-After: 300`, `code: "unavailable"`, message says none of the free uses were spent; upstream fetch never called.
4. `/api/share/:id`: broken → 503 "not a revoked link"; readable miss → 404.
5. `/s/:id`: broken → 200 HTML, `no-store`, `noindex`, generic meta; readable miss → 404.
6. Jobs search: warm KV + shadow with working upstreams, then break KV **and** upstreams → 200 from the Cache API shadow with the same rows.
7. Jobs search with no shadow and dead upstreams → the existing 502 sentence.
8. A generic KV-backed API route (`/api/license/verify`) with broken KV → 503 JSON, `Retry-After: 300`, `no-store`, `code: "unavailable"`.

On the R821 tree (separate worktree) the same file fails 7 / 8 (only `/api/health` passes).

The Worker test uses `KVNamespace` / `Fetcher` / `ExecutionContext` types, so it is compiled by
`worker/tsconfig.json` (`include` gains `../tests/worker-*.test.ts`) and excluded from the
Vite-typed `tsconfig.test.json`; vitest still picks it up (16 files, 299 tests).

## Gates

vitest 299 / `tsc -p tsconfig.app.json` / `tsc -b` / eslint (0 errors, 11 pre-existing warnings) /
`npm run build` / `verify-dist` (123 URLs) — all green.

## Deploy + production verification (during the live outage)

`npm run deploy`: 30 assets uploaded, route listing still `code: 10000` (token permission, not
redeployed for it). Production KV was **still exhausted** when the new Worker went live
(`wrangler tail`: `KV get quota:* failed: KV get() limit exceeded for the day.` on the first
post-deploy request), so the degraded paths were verified against the real failure, not a mock:

| request | before | after |
|---|---|---|
| `GET /api/ai/quota` (`x-client-id`) | 500 text | **200** `{"freeRemaining":null}` |
| `GET /api/jobs/search?q=engineer` / `nurse` | 500 | **200** with rows (first `nurse` 0.9 s from the boards, then 0.11 s from the shadow) |
| `POST /api/ai/rewrite` (unlicensed) | 500 | **503** `code: unavailable`, `Retry-After: 300`, "None of your free uses were spent" |
| `GET /api/share/nonexistent123` | 500 | **503** `code: unavailable`, "This is not a revoked link" |
| `GET /s/nonexistent123` | 500 | **200** HTML shell, `no-store`, `noindex` |
| `GET /api/health`, `/pricing/` | 200 | 200 |

Note: the very first `/api/ai/quota` probe ≈ 8 s after upload still returned the old 500 (edge
still rolling the Worker over); every request from ≈ 40 s on answered from the new Worker. Judge
a deploy by a later cache-busted request, not the first one (R813 / R819 cache note again).

## Production QA (testing agent, independent 1280 and 375, cache disabled, storage restored byte for byte)

`/home/ubuntu/qa/r822-qa/` — **1280 22/22, 375 28/28**; 321 GET / **1 POST** (the single
authorised AI refusal) / 0 downloads / 0 page errors; the only console errors are Chromium's
resource lines for the four share 503s and the one AI 503.

- `/s/nonexistent123` at both widths: 200 shell, app renders, message "Loading shared resumes is
  temporarily unavailable … This is not a revoked link." with **Try again**; Try again re-requests
  `/api/share/nonexistent123` (503 again) and keeps the same message; no "gone / revoked" wording.
- `/jobs`: "engineer" 140 rows, "nurse" 7 rows, detail pane works; 375 row → detail → Back to list.
- `/builder`: six `/api/ai/quota` responses `200 {"freeRemaining":null}` `no-store`, no fabricated
  "N free uses left"; one **Suggest a bullet** → 503 `unavailable` `Retry-After: 300`, the exact
  paused message shown in the UI, inputs and stored resume bytes unchanged (SHA-256 before = after).
- Sanity: `/`, `/dashboard`, `/pricing/`, paste-only `/ats-checker` (score 86) at both widths.
- No KV recovery observed during the run.

Screenshots: `1280-share-unavailable.png`, `375-share-unavailable.png`, `375-ai-paused.png`,
`1280-ai-paused-same-response.png` (same live response, resized — one AI call only), jobs detail
shots. Recordings `r822-1280-readable-2x.mp4` (50.5 s), `r822-375-readable-2x.mp4` (30.5 s).

Harness notes (not product): the desktop harness first used the wrong roles for the Jobs search
box (`type=search`, aria-label `Search jobs by title`), the nested `job-card-*` buttons and the ATS
heading (`#ats-result-heading` has an sr-only score suffix); corrected copies kept alongside the
originals; Playwright viewport resizes can un-maximise the real Chrome window (re-maximise before
recording).

## Boundaries (stated, not hidden)

- **Fail closed** on the free tier during an outage: unlicensed AI is paused until KV reads
  again (licensed requests are unaffected — they never touch KV in the gate). The message says
  so and that nothing was spent.
- The Cache API shadow is per data centre: after the KV cap is hit, each colo asks the upstream
  boards once per query per TTL (1 h / 5 min degraded) instead of once globally; the shadow's own
  TTL follows the KV TTL via `s-maxage`. It answers with the last snapshot written from **that**
  colo; a colo with no shadow goes straight to the boards (still 200) and only 502s when the boards
  are also down (unchanged sentence).
- Shares have **no** fallback copy on purpose: a KV outage makes every share link answer a
  truthful 503 with Try again, never a 404, never a stale copy after a revoke.
- Share creation / deletion, licence activation, checkout and webhooks answer 503 + `Retry-After`
  during the outage; they were 500 before. The Lemon Squeezy webhook 503 means the provider retries
  later (their retry behaviour is the provider's, not verified here).
- `/s/:id` served during an outage carries the generic title / description (no résumé name in the
  link preview) and `noindex`.
- The account-level cause is unchanged: the daily KV cap is still consumed by `watchdeck` /
  `linkshop-edge`. Resource request to the boss stands: Workers Paid **or** move those Workers'
  hot reads to the Cache API in their own repos.
