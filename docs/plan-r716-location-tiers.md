# R716 — Location filter includes postings open to the place's country / region (degraded R716 without Adzuna/JSearch keys)

## Why

R713 kept "Job search coverage / location filter" as a P1 that needs Adzuna/JSearch keys (resource request, no answer yet). Company OS rule 6: a missing resource must not stall the round — ship the degraded step that needs no key.

First-hand production data (`qa/r716-*.json`, 8 queries × 150 postings from `/api/jobs/search`, 948 rows) shows the location filter under-includes rather than the feeds lacking locations:

- Distinct location parts: `usa 196 · london 166 · paris 111 · europe 74 · uk 58 · france 50 · canada 49 · latam 29 · united kingdom 27 · germany 20 · emea 19 · greater london 19 · münchen 18 · … · londres 8 · royaume-uni 4`.
- `/jobs` filter "London" (substring on `location`) on the `london` query: 63 direct matches; **24 postings whose location is `UK` / `United Kingdom` / `EMEA, UK` and 6 `Europe` / `EMEA` are dropped entirely** — including three whose *title* says London ("Enterprise Account Executive - London" → location `UK`). A London candidate qualifies for all of them.
- Filter "UK": `United Kingdom`, `Royaume-Uni`, `England` postings are dropped (different spelling), while `Ukraine` matches (substring).
- Filter "Berlin": 16 direct, and every `Germany` / `Europe` posting is hidden.

## Change

`src/lib/jobs.ts`

```ts
export type LocationTier = 'direct' | 'wider' | 'anywhere'
export function locationTier(location: string, filter: string): LocationTier | null
export function widerAreasOf(place: string): string[]   // "London" → ["UK","Europe","EMEA"]; "UK" → ["Europe","EMEA"]
```

- Gazetteer built from the labels the three feeds actually emit: `COUNTRY_ALIASES` (UK ↔ united kingdom / england / royaume-uni…), `REGION_ALIASES` (Europe ↔ eu / european timezones…), `REGIONS_OF_COUNTRY`, `CITY_COUNTRY` (the cities in the sample + the obvious capitals).
- `direct`: the typed text as a word/prefix (`uk` no longer hits `Ukraine`), or any alias of the same country/region.
- `wider`: the place's country (for a city) or a region containing it.
- `anywhere`: unchanged `isLocationAgnostic`.

`src/pages/Jobs.tsx`: results are `direct → wider → anywhere`, each tier sorted by the chosen sort; a header row `Open to UK / Europe / EMEA (N)` precedes the wider tier, the existing `Open to any location (N)` header precedes the last. No API / storage change.

## Verification

`qa/r716-probe.mts` over the 948 sampled postings:

| filter | direct | wider | anywhere | none |
|---|---|---|---|---|
| London | 193 | 136 (`UK`, `Europe`, `EMEA, Europe`, …) | 89 | 530 |
| UK | 101 (was 106 — 5 `Ukraine` rows were false hits) | 75 | 89 | 683 |
| Paris | 125 | 116 | 89 | 618 |
| Berlin | 16 | 109 | 89 | 734 |
| Europe | 74 | 0 | 89 | 785 |
| New York | 0 | 200 (`USA`, `Canada, USA`, …) | 89 | 659 |
| Atlantis | 0 | 0 | 89 | 859 |

Edge cases: `Ukraine`/UK → none; `EMEA, UK`/London → wider (the country, not the city, is named); `Louisiana`/USA → none; `Australia`/Austria → none.

Production: see `qa/r716-evidence.cjs` results in `docs/handoff-context.md` (R716).

## Honest limits

- Still no non-remote local postings (nurse / retail / trades) — that needs Adzuna/JSearch; this round only stops hiding what the feeds already carry.
- The gazetteer is a hand list from ~950 sampled postings; a city outside it (e.g. "Bath") gets substring matching only, as before.
- `Remote · Remote job` (Arbeitnow's remote label) is still not treated as location-agnostic (pre-existing `isLocationAgnostic`, unchanged this round).
