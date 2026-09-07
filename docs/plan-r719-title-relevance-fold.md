# R719 — Job search: body-only matches fold behind a count instead of diluting the list

## Why

First-hand production evidence (2026-09-06, `/api/jobs/search` on index-CWwPqx9V.js):

| query | rows | title carries the query | title does not |
| --- | --- | --- | --- |
| `nurse` | 26 | 6 | 20 (psychiatrist, ML engineer, sales, pharmacist, …) |
| `teacher` | 14 | 7 | 7 |
| `barista` | 4 | 0 | 4 (systems engineer, marketing manager — "free barista coffee") |
| `accountant` | 28 | 11 | 17 |
| `designer` | 76 | 36 | 40 |
| `frontend engineer` | 72 | 20 full + 48 partial | 4 |
| `product manager` | 150 | 66 full + 39 partial | 45 |

The Worker (R704) requires every query token somewhere in title / company / category /
location / tags / **description**, ranks title hits first (`queryRank` 2 → 1 → 0) and
interleaves per feed. So the list is right at the top, but for short role queries the
tail is mostly postings that merely *mention* the word in the body, listed with the same
weight as the real ones — the `barista` search shows four engineering / marketing jobs and
nothing says why. Rezi's board (R713 capture) shows title-relevant rows only.

Dropping the body-only rows server-side would hide the only results a small-market query
has (`barista` → 0) and would break `?job=` deep links to such rows.

## Change (client only, `src/lib/jobs.ts` + `src/pages/Jobs.tsx`; Worker / cache / storage untouched)

- `queryTitleRank(query, title): 0 | 1 | 2` mirrors the Worker's title tiers on the client
  (empty query → 2, i.e. everything counts as a title hit).
- `Jobs.tsx` keeps `fetchedQuery` (the query the current `jobs` were fetched for, so
  editing the search box before pressing Search does not reshuffle the list) and splits
  the "All jobs" rows into `titleHits` (rank > 0) and `textOnly` (rank 0). The three
  location tiers (direct → wider → anywhere, R716/R718) are built from `titleHits`;
  `textOnlyInPlace` = body-only rows that pass the same location filter.
- Body-only rows are appended **only** when
  - the user asked (`textOnlyExpandedFor === fetchedQueryKey` — a new query starts folded
    again without any effect / ref), or
  - there is no title hit to show (`barista`), or
  - one of them is the selected row (a `?job=` deep link never points at a hidden row).
- List header: `6 jobs found · 20 more only mention it in the description`; a full-width
  outline button below the list: `Show 20 more that only mention “nurse” in the
  description`. Once expanded, a group header `Only mention “nurse” in the description
  (20)` + `Hide`; with no title hits the header reads `No job title matches “barista” —
  these 4 only mention it in the description` (no Hide), and with a location and title
  hits elsewhere `No job titled “nurse” is in Bath — these N only mention it …`.
- `Hide` moves the detail pane off a folded row to the first title hit (or nothing).
- `fetchJobs` auto-pick: first row that is in the typed place **and** a title hit while
  any exists (body-only rows start folded), so the pane never opens on a hidden row;
  explicit selections / tracked rows keep the R718 rules.
- Location facets are computed from title hits when there are any, so the chips do not
  advertise places that only the folded rows are in.

## Verification

- `npx tsc --noEmit -p tsconfig.json` / `-p worker/tsconfig.json`, `eslint src/lib/jobs.ts
  src/pages/Jobs.tsx` (only the pre-existing exhaustive-deps warning), `npm run build`,
  `npm run verify-dist` — green.
- Production (index-CufPT9o2.js, `qa/r719-verify.cjs` at 1280 and 375,
  `qa/shots/r719/`): `nurse` → 6 rows + header "· 20 more only mention it…" + Show
  button; expand → 26 rows, group header + Hide; select a body-only row then Hide → 6 rows,
  detail back on the first nurse-practitioner row, URL loses `&job=`; expand then search
  `teacher` → folded again (7 + "Show 7 more"); `barista` → 4 rows under "No job title
  matches “barista” — these 4 only mention it in the description", no Hide;
  `designer&loc=London` → 7 direct + "Open to UK / Europe / EMEA (8)", 20 body-only folded;
  `?q=nurse&job=<body-only id>` → auto-expanded, that card rendered and selected. Both
  widths: overflow 0, 0 console errors, storage back to baseline.

## Honest limits

- Title relevance is a substring test on the title, same as the Worker — `nurse` also
  counts "Nurse Practitioner" (intended) and would count "Nursery Manager"; no stemming
  or synonyms here (the ATS matcher's R710 stemming is a different contract).
- The Worker still returns and caches the body-only rows; this is disclosure + ordering,
  not a recall change. `JOBS_MAX_RESULTS = 150` can still be filled by body-only rows for
  a broad query (`product manager`: 45 of 150), which then folds them client-side.
- Tracked / status tabs are untouched (they list what the user saved).
