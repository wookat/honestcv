# R717 — On-site postings for a typed city via The Muse (keyless), degraded step for the "location-aware job search" P1

## Why

R713/R716 left the same P1 open: every feed HonestCV aggregates (Remotive, Jobicy,
Arbeitnow) is remote-only, so a nurse / teacher / barista in Chicago gets nothing local
even after R716 stopped hiding "open to USA" postings. The proper fix needs Adzuna or
JSearch keys (resource request, no answer). Company OS rule 6: ship the keyless degraded
step now, replace when the key arrives.

First-hand evidence (2026-09-06, direct calls to `https://www.themuse.com/api/public/jobs`,
no key):

- `location=New York, NY` → 100+ pages; `location=London, United Kingdom` → dozens of pages;
  `Berlin, Germany`, `Paris, France`, `Toronto, Canada`, `Sydney, Australia`, `Tokyo, Japan`
  all return postings whose `locations[]` contains that exact label.
- The API matches the label loosely: results for "Berlin, Germany" also include
  `Flexible / Remote` rows and rows whose only listed location is another city, so
  rows are kept only when the exact label is present in `locations[]`.
- Labels are The Muse's own vocabulary (`Prague, Czech Republic` not `Czechia`;
  `New York, NY` not `New York, USA`) — a typed place therefore has to be mapped to a
  verified label, and unknown places must not be sent as free text.
- `category=Healthcare` works; `category=Nursing` returns 0 — the category vocabulary
  is the site's ~30 labels, so HonestCV's category slugs and query words are mapped
  to those labels.
- `descending=true` does not give a clean chronological order; postings back to 2025
  appear, and some employers (Santander US, Capital One) fill whole pages.

## Change

`worker/index.ts` (endpoint `/api/jobs/search`, response shape `{ jobs, source, sources }` unchanged)

```ts
GET /api/jobs/search?q=&category=&location=        // `location` new, optional, ≤60 chars
museLocation(raw) → 'New York, NY' | null           // typed "nyc" / "New York" / "new york, ny"
fetchMuse(label, categories)                        // ≤5 pages, exact-label rows only,
                                                    // ≤120 days old, ≤8 rows per employer
cacheKey = `jobs:v11:${q}|${category}|${museLabel ?? ''}`
sources += 'themuse' only when a label was recognised and the feed answered
```

- `MUSE_US` / `MUSE_WORLD`: ~90 city labels verified against the API (US metros, UK,
  EU capitals, CA/AU/JP/SG/IN/LATAM). Anything else → the three remote feeds, exactly
  as before (same cache key as no location).
- Categories: with a HonestCV category slug → `MUSE_CATEGORIES[slug]`; without one, the
  query picks them (`nurse` → Healthcare, `barista` → Retail / Food and Hospitality…),
  otherwise no category filter.
- Rows are normalised like the other feeds (plain-text description, tags from
  categories + levels, `Flexible / Remote` → `Remote`); a row The Muse leaves
  uncategorised keeps `category: ''` instead of its title.
- The local query-token / category filter, dedupe and per-feed interleaving apply to
  Muse rows too, so a Muse posting still has to match the typed query.

`src/lib/jobs.ts`: `searchJobs(q, category, location)` sends `location`; `CITY_SYNONYMS`
gains `new york ↔ nyc`, `washington ↔ washington dc ↔ dc` so the R716 tiering shows the
Muse rows as `direct`.

`src/pages/Jobs.tsx`: a settled location (700 ms after the last keystroke, only when it
changed) re-runs the search in the background — the list stays until the new one lands;
searches are numbered so a slower earlier response cannot overwrite a later one.
Placeholder `Location, e.g. London`; source line names The Muse.

## Verification

Local `wrangler dev` (built Worker, fresh KV):

| request | sources | muse rows | note |
|---|---|---|---|
| `q=&location=nyc` | +themuse | 43 of 150, 11 employers, max 8/employer | oldest 2026-05-13 |
| `q=&location=London` | +themuse | 27, 4 employers | |
| `q=barista&location=Chicago` | +themuse | 1 (`Café Ambassador – Chicago Area`, Capital One) | was 4 remote rows |
| `q=teacher&location=Boston` | +themuse | 4 (KinderCare, `Boston, MA`) | was 14 remote rows |
| `q=engineer&location=Toronto` | +themuse | 3 (TD Bank `Toronto, Canada` …) | |
| `q=nurse&location=London` | +themuse | 0 | Muse has no London nursing rows — remote list unchanged |
| `q=&location=Atlantis` | remotive+jobicy+arbeitnow | — | unknown place → no Muse call |

`locationTier` probe: `New York, NY`/nyc → direct, `Washington, DC`/dc → direct,
`Chicago, IL`/chicago → direct, `USA`/chicago → wider, `Ukraine`/dc → none.

## Honest limits

- Coverage is The Muse's employer base (large US/UK employers); a Chicago barista search
  finds one posting, not a labour-market listing. This is a degraded step, not the
  Adzuna/JSearch integration.
- City list is hand-verified; a place not in it silently falls back to remote-only
  results (no "no local feed for X" message yet).
- The Muse's own categorisation is trusted (a "Veterinary Claims Specialist" tagged
  Software Engineering by them shows under software development).
- Terms of use of the public API were not reviewed by counsel; the feed is attributed and
  links out to themuse.com like the other three.
