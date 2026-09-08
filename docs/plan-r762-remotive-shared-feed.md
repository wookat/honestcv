# R762 — Remotive: one shared snapshot instead of a per-query request the upstream ignores

## Evidence (first-hand, 2026-09-06 … 09-08)

- Public endpoint `https://remotive.com/api/remote-jobs` answered **the same 17 rows** to every variant tried
  (`?search=nurse`, `?search=engineer`, `?search=sales%20manager`, `?category=software-dev`, `?limit=200`,
  `?search=nurse&limit=5`, and no parameters): `total-job-count: 17`, `job-count: 17`, identical id set
  (`1185979 … 2091105`). Response headers `cache-control: no-store` / `cf-cache-status: HIT` / `age: ≈59 700 s`
  — the page itself is served from Remotive's edge cache for ~16 h, so parameters cannot be applied per request.
  Rows are recent (published 2026-08-08 … 2026-09-05; Lemon.io, A.Team, TELUS Digital, Coalition Technologies…),
  i.e. a fixed public sample, not a dead feed. (`qa/r762-remotive-headers.txt`, `qa/r762-remotive-nurse.json`)
- The response's own `warning` / legal notice: the public API is delayed 24 h, "please limit your requests to ~4
  per day", link back to the Remotive URL **and** mention Remotive as a source; excessive use may be blocked; a
  paid private API exists.
- Deployed Worker (R761 `index-dUpbvaSX.js`): `fetchRemotive(query.upstream, category)` set `search`, `category`
  and `limit=50` and ran on **every uncached query and every broader-query candidate** (up to 1 + 4 + 3 requests
  per search), each returning the same page. R722 already shares Arbeitnow / Muse snapshots because they ignore
  the query; Remotive was left per-query because at R704 it still honoured `search`.
- Production contribution before the change (R748 / this round): `react` Remotive 6 · Jobicy 50 · Arbeitnow 24;
  `writer` 2 / 34 / 9; `customer support` 2 / 49 / 99; `nurse` 0 / 24 / 3; `sales manager` 1 / 48 / 69. The
  local relevance filter (`assembleJobs`) already removes the unrelated rows, so users never saw the 17 rows as
  "nurse" results (R748 finding); the remaining rows are real matches worth keeping.

**Classification**: request-shape / rate defect, not a data-quality defect. Nothing wrong reaches the user; the
Worker asks Remotive for something it cannot do, ~10–20× more often than its terms allow, and would lose the feed
on a block. R748's "Remotive attribution: keep or drop" question resolves to **keep**: the feed still contributes
matching rows for several queries, the terms require the attribution we already show (page intro link + per-row
`source` → "via Remotive" in the detail pane, R747), and dropping a working source without a replacement would
lose real jobs.

## Rejected alternatives

- Remove Remotive: loses 1–6 matching rows on common queries; no keyless replacement measured (Adzuna / JSearch
  keys are still an open resource request).
- Keep per-query requests, only lower `limit`: the parameters are ignored, so the request count (the thing the
  terms constrain) does not change.
- Fetch the page once per 24 h: the terms say "~4 per day"; 6 h honours that with headroom and matches the ~16 h
  upstream edge age observed, so a shorter window buys nothing.

## Change (Worker only, `worker/index.ts`)

```ts
+ const JOBS_REMOTIVE_FRESH_MS = 6 * 60 * 60 * 1000      // Arbeitnow / Muse stay at 15 min
- async function fetchRemotive(q, category)               // search / category / limit=50
+ async function fetchRemotive()                          // plain GET, one page
  async function sharedFeed(c, key, load, freshMs = JOBS_FEED_FRESH_MS)   // per-feed freshness
  fetchJobFeeds: remotive = shared ? shared.remotive
-                : fetchRemotive(query.upstream, category)
+                : sharedFeed(c, 'jobs:feed:v3:remotive', fetchRemotive, JOBS_REMOTIVE_FRESH_MS)
  broaderQueries: shared = { remotive, arbeitnow, muse }  // candidates reuse the page; Jobicy still re-asked
```

Category / query filtering, per-row `source` stamping, dedupe and interleaving are unchanged (`assembleJobs`);
the 24 h keep-TTL / last-good-snapshot fallback from R722 now covers Remotive too. Jobicy is untouched: it does
honour `tag=`.

## Validation

- tsc app + worker, eslint, build, verify-dist.
- Local Worker (`wrangler dev`, real upstreams, `qa/r762-local.mjs` → `qa/r762-local.json`): 7 queries incl. a
  broader-query case; KV inspected for `jobs:feed:v3:remotive`.
- Deploy `npm run deploy`; production `/api/jobs/search` with fresh query strings (bypassing the ≤60 min query
  cache); `/jobs` 1280 + 375 detail pane still says "via Remotive" for a Remotive row.

## Result

- Local: one `jobs:feed:v3:remotive` snapshot (17 rows, written at the first uncached query, 24 h TTL) served all
  later queries; per-query rows identical to production before the change — `nurse` 0 / 24 / 3, `react` 6 / 50 /
  24 (`Senior React Full-stack Developer` …), `writer` 2 / 34 / 9, `customer support` 2 / 49 / 99, `engineer` 5 /
  50 / 95, `sales manager` 1 / 48 / 69; `Registered Nurse - ICU` → 1 row, broaden offers `nurse · 27 jobs · 6
  titled` (the broader candidates reused the snapshot). `sources` still lists `remotive` on every response.
- Gates: tsc app + worker / eslint / build / verify-dist green.
- Production (version `7f6e0bc0`, fresh query strings): `golang developer` 34 = Remotive 5 / Jobicy 26 / Arbeitnow 3,
  `copywriter` 5 (1), `devops` 77 (5), `Senior Rails Engineer (Remote)` 72 (6) + broaden `engineer · 150`, `face
  deduplication` 2 (1); all 200, ≤2.8 s. `/jobs` 1280 + 375: detail pane `posted 18 days ago via Remotive`, intro link,
  Apply link to remotive.com, 0 console errors, 0 overflow, storage unchanged. Production KV not readable with the
  deploy token (401), so the request-count reduction is verified locally and inferred in production.

## Boundaries

- The 17-row page is what Remotive chooses to publish for free; if it starts honouring `search` again the Worker
  will not notice (it would keep filtering the shared page locally) — the feed would gain nothing, lose nothing.
- 6 h freshness ≈ 4 requests / day per Worker deployment (Cloudflare KV is global, so one snapshot serves all
  edges); a cold KV after a deploy costs one extra request.
- Attribution wording on `/jobs` ("Remote and European jobs via Remotive, Jobicy and Arbeitnow") is unchanged;
  it is true for the rows shown and satisfies the Remotive terms; it does not disclose that Remotive's share is a
  17-row public sample (deliberately — the per-row `source` is the honest signal).
