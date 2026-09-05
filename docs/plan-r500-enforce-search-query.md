# R500 — enforce the search query server-side (upstream now ignores it)

## Evidence (first-hand, 2026-08-31)

- Production `/api/jobs/search?q=zzzunfindablequery` returns 15 jobs; none contain the query.
- Upstream direct: `https://remotive.com/api/remote-jobs?search=kubernetes`, `?search=qqqqqq`,
  `?search=underwater basket weaving`, `?category=software-dev`, `?limit=3`, and no params all
  return the identical 15-job list (`job-count: 15`) — Remotive's free API currently ignores
  `search`, `category`, and `limit` entirely.
- Consequence in production: typing any search term on /jobs shows the same unrelated 15 jobs,
  silently pretending the search worked. Category filtering still works because
  `matchesCategory()` is already enforced worker-side (comment there: "the upstream parameter is
  not always honored") — the same defense was never applied to `q`.
- Client already has an honest empty state (`Jobs.tsx`: "No jobs found — try another search
  term."), so returning a truthful empty list renders correctly.

## Fix (worker/index.ts only)

In `/api/jobs/search`, after category filtering, enforce the query locally: split `q` into
whitespace tokens, lowercase, and require every token to appear as a substring of the job's
combined `title / company / category / tags / location / description` text. Keep sending
`search=` upstream (harmless if they fix it). Bump the KV cache namespace `jobs:v5` → `jobs:v6`
(v5 entries hold unfiltered results per query).

## Non-goals

- No paid/alternate jobs API, no scraping, no pagination workarounds for the 15-job cap.
- No client changes; no change to the 8000-char description cap or matching/tailoring.
- No fuzzy/stemming search — plain token-AND substring is honest and predictable.

## Validation

tsc -b, eslint worker/index.ts, build, verify-dist; deploy; production QA:
- `?q=zzzunfindablequery` → 0 jobs; UI shows the honest empty state.
- `?q=engineer` → only jobs whose text contains "engineer".
- multi-token query behaves as AND; empty q returns the full list; category filter regression.
