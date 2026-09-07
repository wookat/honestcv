# R720 — Job search: natural-language role queries (grade words rank, brackets and connectors do not gate)

## Why

First-hand production evidence (2026-09-07, `/api/jobs/search` on index-DQihDExB.js, before
this round): the Worker required **every whitespace token** of the query to appear somewhere
in title / company / category / location / tags / description, and ranked a title 2 / 1 / 0 by
how many of those literal tokens it contained.

| typed query | what was actually required | effect |
| --- | --- | --- |
| `Senior Frontend Engineer (React)` | `senior`, `frontend`, `engineer`, `(react)` | only ads whose text literally contains `(react)`, brackets included; `senior` had to appear somewhere in the ad |
| `Sr. Data Analyst` | `sr.` | `sr.` matches only "Sr." with the dot → rows written "Senior Data Analyst" lost |
| `Head of Marketing` | `head`, `of`, `marketing` | `of` is in every ad; `head` had to appear somewhere in the body → "Head of Growth Marketing" ranked level with any marketing ad that mentions "head" |
| `Software Engineer II` | `ii` | matched "ii" inside "skiing", "Wii", "IIoT" |
| `UX/UI Designer` | `ux/ui` | designer ads written "UI/UX" or "UX / UI" lost |
| `Customer Success Manager (Remote, UK)` | `(remote,`, `uk)` | only ads literally containing `(remote,` and `uk)` |

Rezi's board (R713 capture) and every mainstream job board treat the typed string as a role
description, not as literal AND-ed tokens: the grade word orders, the qualifier in brackets
orders, the connectors are noise. The client computed its own copy of the tier logic
(R719 `queryTitleRank`), so the two had to change together.

## Change

### `worker/jobQuery.ts` (new, shared by Worker and client)

```ts
parseJobQuery(raw) → {
  required: string[][]   // every group must match; a group matches on any alternative
  ranking: string[]      // grade words / bracketed qualifiers: order only, never gate
  dropped: string[]      // connectors and work-arrangement words: neither
  upstream: string       // `required` flattened, for the feeds' own search parameter
}
matchesJobQuery(query, haystack)   // AND over groups, OR inside a group
jobTitleRank(query, title): 0|1|2  // 2 = every required group in the title, 1 = some, 0 = none
jobRankingHits(query, title)       // how many ranking words the title carries (senior≡sr≡snr, junior≡jr, vp≡vice president; ≤3-letter forms whole-word only)
```

- Grade words: `senior sr snr junior jr jnr lead staff principal associate mid midlevel entry
  graduate trainee head chief director vp i ii iii iv v 1 2 3` → `ranking`.
- Anything inside `(…)` / `[…]` → `ranking` (a bracketed word is a preference, not a filter).
- Connectors / arrangement (`of and & the a an for in at to with or remote hybrid onsite
  full-time part-time contract freelance permanent temporary role position job jobs level`)
  → `dropped`.
- Alternatives inside one required group: `ux/ui` → `ux` or `ui`; `full-stack` → `full-stack`,
  `full stack`, `fullstack`; `frontend` → `frontend`, `front-end`, `front end`; trailing dots /
  quotes / commas trimmed (`Sr.` → `sr`, `Payments,` → `payments`).
- A query that is only grade words (`Senior`) keeps them as required so it still finds something.

### `worker/index.ts`

- `matchesQuery` / `queryRank` replaced by the shared functions; cache key `jobs:v14:<upstream>|<ranking>|…`.
- Ordering inside each title tier: titles carrying more ranking words form their own band
  across all feeds before the per-feed interleave (`Head of …` rows first for `Head of
  Marketing`, both `Software Engineer II` rows first for `Software Engineer II`).
- Response gains `query: { terms, ranking }` so the client can show how the query was read.
- A response missing a feed (upstream timeout / 5xx) is cached 5 min instead of 60 — a
  `frontend engineer` probe had been serving `remotive+jobicy` only for the rest of the hour.

### `src/lib/jobs.ts` / `src/pages/Jobs.tsx`

- `queryTitleRank()` now delegates to the shared `jobTitleRank(parseJobQuery(q), title)` so
  the R719 fold uses exactly the Worker's tiers.
- `describeJobQuery(q)` → `{ searched, ranking, dropped } | null`; when non-null the list
  header gets a second line: *Matching “frontend engineer” · “senior”, “react” only rank
  titles higher · “remote” ignored*. Bare role queries (`nurse`) show nothing new.
- The R719 fold / "Show N more that only mention “…” in the description" label uses the
  searched role words, not the raw string.

## Verification

- `qa/r720-probe.mts`: 16 parser cases (see table above plus `C++ Developer`, `.NET
  Developer`, `Machine Learning Engineer – Remote`, empty string).
- Local: `tsc` (app + worker), `eslint src/lib/jobs.ts src/pages/Jobs.tsx worker/index.ts
  worker/jobQuery.ts` (only the pre-existing `fetchJobs` exhaustive-deps warning), `prettier
  --check worker/jobQuery.ts`, `npm run build`, `npm run verify-dist` green.
- Production API (`qa/r720-prod2.cjs`, after `npm run build` + `wrangler deploy`):
  `Senior Frontend Engineer (React)` 75 rows (`terms:["frontend","engineer"]`, `ranking:["senior","react"]`), top 8 all "Senior … Frontend …";
  `Sr. Data Analyst` 57, first 5 "Senior Data Analyst …"; `Head of Marketing` 142, first 5
  "Head of …"; `Software Engineer II` 150, both "… II" rows first; `frontend engineer` 75
  with all three feeds; `nurse` 25 / `barista` 4 unchanged (`terms:["barista"]`).
- Production UI (`qa/r720-verify.cjs`, 1280 + 375, `qa/shots/r720/`): header line
  "Matching “marketing” · “head” only ranks titles higher · “of” ignored"; `Customer Success
  Manager (Remote, UK)` 81 rows + "“uk” only ranks titles higher · “remote” ignored"; body-only
  fold still counts and expands; `nurse` shows no note; 0 horizontal overflow, 0 console
  errors, storage back to baseline.

## Deploy lesson (recorded for every later round)

`wrangler deploy` uses the **redirected config `dist/honestcv/wrangler.json`** written by
`npm run build` (Cloudflare Vite plugin), so it uploads `dist/honestcv/index.js`, not
`worker/index.ts`. Editing the Worker and deploying without rebuilding ships the previous
build — this is what the "first deploy still serves the old bundle, second deploy works"
notes in R607 / R667 / R682 were seeing. Always `npm run build` (or `npm run deploy`) first;
`wrangler deploy --dry-run --outdir` shows what will actually go up.

## Honest limits

- `Registered Nurse - ICU` still requires all three role words (1 row on the current feeds).
  Dropping the last word automatically would guess at the user's intent; a "broaden to
  ‘nurse’ (25)" suggestion when a multi-word query returns very few rows is the R721 candidate.
- `barista` still returns 4 description-only rows ("free barista coffee" perks in Graphcore /
  Funding Circle ads). Upstream really has ~19 barista rows (Remotive 17, Arbeitnow 2) but they
  are not in the ≤200-per-feed windows the Worker pulls; R719's truthful header stays the
  disclosure.
- Bracketed words are ranking-only, so `(Remote, UK)` treats `uk` as a title preference, not a
  location filter — the location box is the filter; the header line says so.
- Grade equivalence is a fixed table (senior/sr/snr, junior/jr/jnr, vp); no stemming or
  synonyms for role words (`nurse` still hits "Nursery").
