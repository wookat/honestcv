# R19 — Jobs board depth: filters, sort, logos, resume-seeded search

Date: 2026-08-29 · Round: R19 · Status: approved (CHARTER 提议即默认方案)

## First-hand evidence (2026-08-29 re-audit, logged-in Rezi)

Screenshots in `~/audit-r1/shots-r19/` (`app-job-search*.png/txt`, `rezup-jobs*.png/txt`):

- Rezi job-search top bar: **job-title box prefilled from the resume's target role**
  ("Software Engineer"), a **location box** ("US"), and a **FILTER** button.
- List header has a **BEST MATCH sort dropdown**.
- Each list row and the detail pane show the **company logo**.
- Tabs: All Jobs / Saved / **Matched** / Applied / Interviewing / Rejected.

Our /jobs (R17 MVP) today: title search only, no location filter, no sort, no
logos, empty search box on load.

## Scope (honest, small batch)

1. **Seed the search from the draft**: on first load, if the local draft has a
   `targetRole`, prefill the search box with it and run that search (mirrors
   Rezi's prefill; falls back to the empty "all jobs" query).
2. **Category filter**: Remotive's API supports `category=` natively — add a
   category `<select>` (fixed Remotive slugs) wired through the Worker proxy.
3. **Location filter**: client-side substring filter over the job's
   `candidate_required_location` text (no fake geo search).
4. **Sort**: `Relevance` (upstream order, default) / `Newest` (by
   `publication_date`), client-side.
5. **Company logos**: Remotive returns `company_logo` — pass it through as
   `logo`, render in list + detail with graceful hide on load error. CSP
   `img-src` gains `https://remotive.com`.

Out of scope (unchanged decisions): Matched tab / match scores (no honest
model), multi-source jobs (needs Adzuna/Jooble keys, requested), cloud pipeline.

## Architecture

- Worker `/api/jobs/search?q=&category=`: category validated against the fixed
  Remotive slug list; cache key bumped to `jobs:v2:<q>|<category>`; mapping adds
  `logo: company_logo`.
- `JobListing` gains `logo: string` (optional-safe on old cached pipeline
  entries: render only when truthy).
- Jobs.tsx: `category`, `locationFilter`, `sort` state; location + sort apply
  client-side to the fetched list; All-jobs toolbar row gains Category select,
  Location input and Sort select.

## Acceptance

- Draft with targetRole ⇒ /jobs loads with that query prefilled + searched.
- Category select changes upstream results; Location narrows list client-side;
  Newest reorders by date; logos render (and hide when the URL 404s).
- lint/tsc/build green; production QA desktop + 375px (wrap, touch ≥40px, no
  horizontal overflow, console clean); Remotive attribution intact.
