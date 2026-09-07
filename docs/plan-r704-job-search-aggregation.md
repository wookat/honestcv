# R704 — job search: aggregate Remotive + Jobicy + Arbeitnow with local relevance (P0 from R703)

## Evidence

- R703 table #3: Remotive `/api/remote-jobs` returned the same 18 jobs for `?search=frontend engineer`, `?category=software-dev`, `?search=react`; on our board "frontend engineer" = 0 results, "product manager" = 1 unrelated Head of Marketing, London = 6 "Worldwide".
- Direct calls this round: Jobicy `https://jobicy.com/api/v2/remote-jobs?count=50&tag=…` — real fields are `jobTitle`, `companyName`, `companyLogo` (jobicy.com), `jobIndustry[]`, `jobType[]`, `jobGeo`, `jobLevel`, `salaryMin/salaryMax/salaryCurrency/salaryPeriod`, `jobDescription`, `pubDate`; HTML entities in labels. Arbeitnow `https://www.arbeitnow.com/api/job-board-api?page=N` — ~250/page, `slug/title/company_name/location/remote/tags/job_types/created_at(unix)/description(html)`, a large share in German.

## Design

- Worker fetches Remotive + Jobicy + Arbeitnow p1 + p2 concurrently with `AbortSignal.timeout(8_000)`; a failing feed yields `null` and is dropped from `sources`; 502 only when every feed fails.
- Each feed → `NormalizedJob` (existing shape the client already renders). Labels/tags → the existing 14 canonical categories via `canonicalCategory`. Arbeitnow postings whose first 800 chars contain ≥6 German/French stopwords are dropped (`isNonEnglishText`).
- Query and category are enforced locally (`matchesQuery` all-tokens, `matchesCategory`), because upstream `search`/`tag` are unreliable.
- Dedupe by `title|company`; sort newest-first inside each feed; then interleave feed queues within relevance tiers (2 = every token in the title, 1 = some, 0 = body only) so Arbeitnow's daily volume cannot bury the remote feeds; cap 150.
- Cache `jobs:v9:<q>|<category>` for 1h; payload `{ jobs, source: 'remotive+jobicy+arbeitnow', sources }`.
- CSP `img-src` gains `https://jobicy.com`; Jobs.tsx attribution names all three feeds.

Not changed: client filters (type / skills / location facets / sort), pipeline, targeted copies, documents — job ids are already strings everywhere (`jobicy-<id>`, `arbeitnow-<slug>`, Remotive numeric string).

## QA

- Local (wrangler dev): empty 150 = 18/50/82 across feeds; `frontend engineer` 69 (top-10 titles all relevant); `product manager` 150; `react`+software-dev 47; impossible query 0. tsc / eslint / build / verify-dist green.
- Production (`qa/r704-verify.cjs 1280|375`, `qa/r704-flows.cjs 1280|375`, index-ikhfC5mn.js): three-source attribution; `frontend engineer` 69 with 8 location facets; category and facet filters narrow correctly; Jobicy logos load under CSP; deep link `?job=jobicy-152644` → Target my resume → copy with `forJob` → Cover letter dialog → Interview Prep dialog; Saved → Tracked tab; 0 failed requests / console errors; storage back to baseline.
- Honest limits: language filter is a stopword heuristic; locations remain free text per feed; Remotive's empty-query feed is 18 jobs upstream.
