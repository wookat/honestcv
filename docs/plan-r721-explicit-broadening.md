# R721 — Job search: explicit broader-query suggestions when a strict role query has (almost) no complete title matches

## Why

First-hand production evidence (2026-09-06/07, `/api/jobs/search` after R720, index-DQihDExB.js):

| typed query | rows | complete title matches | what a user sees |
| --- | --- | --- | --- |
| `Registered Nurse - ICU` | 1 | 0 | one indirect row; `nurse` alone has 26 rows / 6 nurse titles |
| `Technical Writer` | 4 | 0 | four body-only rows; `writer` has 11 rows / 5 writer titles |
| `Mechanical Engineer` | 25 | 0 | 25 body-only rows; `engineer` has 150 rows / 148 titles |
| `Financial Analyst` | 49 | 5 | fine — no suggestion needed |
| `barista` | 0–4 | 0 | the feeds carry no barista jobs (R720 upstream check) — nothing to broaden to |

R720 deliberately kept every role word required ("Registered Nurse - ICU" needs all three), because
dropping words on the server is guessing intent. But the user cannot know *which* word to drop:
`registered nurse`, `nurse icu`, `registered icu` all have 0 title matches while `nurse` has 6.
Rezi's board and every mainstream board show "did you mean / also try" rows for this case; ours
showed a single indirect row and a truthful-but-dead-end R719 header.

## Contract

- The typed query is never widened on its own: the strict result is what is returned and shown.
- Suggestions appear only when the strict query has fewer than `JOBS_BROADEN_BELOW = 3` complete
  title matches and has 2–4 required groups.
- Each suggestion is a **real search** for the broader query (Remotive / Jobicy re-asked with the
  shorter term; the Arbeitnow / Muse pages already fetched are shared) and reports its own real
  counts: rows returned and complete title matches. The result is cached under the broader query's
  own key, so accepting a suggestion is instant and identical to typing it.
- A broader query is offered only when it clearly beats the typed one: more complete title matches
  than the strict query, at least `JOBS_BROADEN_BELOW`, and complete title matches ≥ 5 % of its
  rows (`JOBS_BROADEN_MIN_TITLED_SHARE`). The share guard kills `icu` alone: 118 rows
  ("diff**icu**lt", "curr**icu**lum") with 1 titled.
- Drop one role word at a time first; only when no such query qualifies fall back to single words
  (queries with > 2 groups). At most `JOBS_BROADEN_MAX = 2` suggestions.
- Ordering prefers the candidate that keeps the **last** role word (English titles are head-final:
  a "Technical Writer" is a writer), then more titled, then more rows. `Technical Writer` →
  `writer` before `technical`, even when `technical` has more raw title hits.
- Body-only rows and the R719 fold / disclosure are unchanged; the suggestion row is additive.

## Change

### Worker (`worker/index.ts`)

```ts
interface JobSearchPayload {
  jobs; source; sources; query: { terms; ranking }
  titled: number                                    // complete title matches (every role word in the title)
  broaden?: { query: string; jobs: number; titled: number }[]
}
broaderQueries(c, query, category, museLabel, feeds, titled)   // see contract above
```

- Cache namespace `jobs:v15` (payload shape changed). Broader results cached under their own key
  with the same degraded/normal TTL rule as any search.
- `fetchJobFeeds(..., shared?)` accepts already-fetched Arbeitnow / Muse pages so a broadening
  round costs only the Remotive + Jobicy calls per candidate.
- `fetchJson` now logs `jobs feed <host> -> <status|error>` via `console.warn` so `wrangler tail`
  shows *why* a feed dropped out of `sources` (it was silent before; see R722 evidence).

### Client (`src/lib/jobs.ts`, `src/pages/Jobs.tsx`)

- `searchJobsWithMeta(q, category, location) → { jobs, broaden }`; `searchJobs` keeps returning
  the array (compat).
- `Jobs.tsx` stores `broaden` with the fetched result (request-sequence guarded like `jobs`), and
  renders, on the All tab under the query header:
  `No job title has all of “Registered Nurse - ICU” — broader: [“nurse” · 6 titles match · 26 jobs]`
  (or `Only 1 job title has all of …` when 1–2). Each pill is a button; accepting it sets the
  visible query, clears the selected row and the R719 expansion, focuses the search input and runs
  a real search (`runSearch`), keeping category / location. Nothing else on the page moves.

## Verification

- `tsc` (app + worker), `eslint src/lib/jobs.ts src/pages/Jobs.tsx worker/index.ts` (only the
  pre-existing exhaustive-deps warning), `npm run build`, `verify-dist` green.
- Local `wrangler dev` with fresh KV: `Registered Nurse - ICU` → `nurse`; `Technical Writer` →
  `writer` (46/9) before `technical` (150/53); `Mechanical Engineer` → `engineer`; `Financial
  Analyst` / `Customer Support Specialist` / `frontend engineer` → no suggestion; `barista` → none.
- Production API (index-C-o0Zw4f.js): `Registered Nurse - ICU` 1 row / 0 titled / broaden
  `nurse 26/6`; `Mechanical Engineer` 25/0 / `engineer 150/148`; `Technical Writer` 4/0 /
  `writer 11/5`; `Financial Analyst` 49/5 none; `frontend engineer` 23/5 none; `nurse` 26/6 none;
  `barista` 0 none; `ICU&location=Boston` 0 none.
- Production UI (`qa/r721-verify.cjs`, `W=1280|375`, `qa/shots/r721/`): strict ICU query stays in
  the input with 1 card + suggestion row; clicking `nurse` → input `nurse`, 6 cards, R719 header
  "6 jobs found · 20 more only mention it in the description", focus on the search input;
  `Technical Writer` → 1 card + `writer` pill; `Mechanical Engineer` → `engineer 148/150` pill;
  `frontend engineer` and `barista` → no suggestion row; both widths `scrollWidth ==
  clientWidth`, pills 18 px (desktop) / 42 px (mobile) tall and in view, 0 console errors,
  storage back to baseline.

## Honest limits

- `titled` counts complete title matches among the ≤150 rows the Worker returns, not among every
  upstream row; for large result sets (`engineer` 148/150) the ratio is what matters and is
  unaffected.
- The 5 % share threshold and `JOBS_BROADEN_BELOW = 3` were set from ~10 real queries, not a
  labelled sample; both are single constants.
- Head-final ordering is a heuristic for English titles; for `Head of Marketing`-style queries
  the parser already leaves one required word, so no suggestion is generated.
- Suggestions depend on which feeds answered: when Jobicy/Arbeitnow are missing from `sources`,
  counts are lower and a suggestion may not clear the bar (degraded responses are cached 5 min).
- Body-only rows for the typed query remain listed/folded as in R719; the suggestion row does not
  replace them.
