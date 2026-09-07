# R722 — Job search: query-independent feeds are fetched once and shared by every query; a failed refresh serves the last good copy

## Why

First-hand production evidence (2026-09-07, `wrangler tail` during the R721 verification burst):

- 12 never-seen queries fired in a row → Arbeitnow answered **HTTP 429** on both pages for 4 of them
  (`jobs feed www.arbeitnow.com -> 429`, logged by the R721 `fetchJson` warning). Those 4 responses
  listed `sources: remotive+jobicy` only, were cached for 5 minutes as degraded, and every count the
  user saw (rows, complete title matches, R721 broaden candidates) was lower than the feed really has.
- Arbeitnow ignores its `search` parameter (R704), so every uncached query downloaded the same two
  pages (~320 rows after language filtering). The Muse is asked per place + category and is likewise
  identical for every query in that place. Only Remotive (`search=`) and Jobicy (`tag=`) really vary
  with the query.
- The rate limit is reproducible from this box: 40 concurrent requests → 25–30 × 429; 10 sequential →
  all 200. A user typing three variants of a role, plus R721's broadening candidates, is exactly the
  pattern that trips it.

## Contract

- `sharedFeed(c, key, load)` (Worker): one KV snapshot per query-independent feed —
  `jobs:feed:v1:arbeitnow` and `jobs:feed:v1:muse:<label>|<categories>` — holding
  `{ at, jobs: NormalizedJob[] }`.
  - Younger than `JOBS_FEED_FRESH_MS` (15 min) → served without touching the upstream.
  - Older → the upstream is asked once; success replaces the snapshot (KV `expirationTtl` 24 h).
  - Upstream failure (429 / 5xx / timeout) with a snapshot on hand → the snapshot is served and a
    `console.warn('jobs feed <key> -> serving N min old snapshot after upstream failure')` is logged;
    the feed stays in `sources`, so counts and broaden candidates are not silently lowered.
  - No snapshot and a failed upstream → `null`, exactly as before (feed absent, 5-minute degraded cache).
- Partial pages never overwrite a whole snapshot: `fetchArbeitnow(allowPartial)` /
  `fetchMuse(label, cats, allowPartial)` accept a missing page only when there is no snapshot to fall
  back on (`allowPartial = snap === null`); otherwise a half feed is treated as a failure and the last
  good copy is served.
- Per-query payload cache (`jobs:v15:*`, 60 min / 5 min degraded) is unchanged; R721's in-request
  sharing of Arbeitnow / Muse pages across broadening candidates is unchanged.
- Response shape is unchanged. Remotive / Jobicy are still fetched per query.

## Changes

`worker/index.ts` only:

```ts
const JOBS_FEED_FRESH_MS = 15 * 60 * 1000
const JOBS_FEED_KEEP_TTL = 24 * 60 * 60

async function sharedFeed(c, key, load: (allowPartial: boolean) => Promise<NormalizedJob[] | null>)
async function fetchArbeitnow(allowPartial: boolean)
async function fetchMuse(label, categories, allowPartial: boolean)
async function fetchJobFeeds(c, query, category, museLabel, shared?)   // now takes the Context for KV
```

## Verification

Local (`wrangler dev --local`, persistent `.wrangler/state` KV):

- 6 fresh single-word queries → all `remotive+jobicy+arbeitnow`; KV gains exactly one
  `jobs:feed:v1:arbeitnow` (expires +24 h); three Boston queries add one Muse snapshot per category
  (`Boston, MA|Education`, `|Food and Hospitality Services`, `|Healthcare`), Muse rows present (teacher 4).
- Stale-while-error: snapshot `at` rewritten to 20 min ago, 80 concurrent direct Arbeitnow requests
  fired to trip the 429, two fresh queries issued during the burst → both answer
  `remotive+jobicy+arbeitnow`, and the snapshot blob is **not** replaced (its `at` is still the aged
  value), i.e. the refresh failed and the last good copy was served.
- `tsc` (worker) / `eslint worker/index.ts` clean; `npm run build` + `verify-dist` OK. Prettier reports
  the same pre-existing style warning on `worker/index.ts` as R701/R702 (unchanged file style).

Production (deployed, `wrangler tail --format json`, 12 fresh queries in a row):

- 12/12 `outcome ok`, 12/12 `sources: remotive+jobicy+arbeitnow`, **zero** `jobs feed … -> 429`
  log lines (R721's identical burst had 4). First request 1023 ms (fills the snapshot), following
  requests 126–400 ms (Remotive + Jobicy only). Wrangler upload OK; Routes still reports code 10000.

## Honest limits

- A stale snapshot is up to 15 min behind the upstream (a job posted in that window appears on the
  next refresh); on upstream failure it can be up to 24 h old and the response does not say so —
  only the Worker log does. Surfacing "feed data from N min ago" in the UI is a possible follow-up.
- Cold start (no snapshot) with a 429 behaves exactly as before: feed absent for that response.
- The 15 min / 24 h constants are judgement calls (Arbeitnow lists ~100 new rows a day), not measured
  against the upstream's actual limit, which is undocumented.
- Remotive / Jobicy are still one upstream request per fresh query each; neither showed a rate-limit
  response in any tail so far.
