# R512 — Location facets and autocomplete offer individual regions, not compound strings

## First-hand evidence (production, 2026-08-31)

- Rezi changelog moved to https://www.rezi.ai/rezi-changelog (old /changelog is 404).
  August 2026 Week 4 lists "Faster Job Location Entry: New location autocomplete
  feature for quick, accurate job location search."
- Production probe of https://cv.zalize.com/jobs:
  - The location input's datalist options are the raw compound location strings
    from listings: `['Americas, Europe, Israel', 'Europe',
    'Europe, USA, UK, Canada, Australia, Singapore',
    'LATAM, Europe, USA, Canada, APAC', 'USA', 'USA, Canada, USA timezones']`.
  - The "Locations:" facet chips (R267) render the same compound strings.
  - A user looking for Canada gets no "Canada" suggestion and no Canada chip,
    even though 3 of the 15 current listings admit Canada. Typing `can` in the
    input suggests nothing (datalist matches from any position in Chrome, but
    the accepted value is the whole compound string, which then filters to only
    that exact listing set rather than "all jobs admitting Canada").
- Filter semantics (src/pages/Jobs.tsx): `j.location.toLowerCase().includes(loc)`
  — a single-region value like `Canada` already filters correctly across all
  compound strings. Only the *suggestions* (datalist + chips) are wrong.

## Root cause

`locationFacets()` (src/lib/jobs.ts) keys facets on the whole trimmed location
string. Remotive listings use comma-separated multi-region strings, so facets
are compound labels a user would never type, and per-region counts are wrong
(each compound string counts as its own bucket of 1–3 instead of contributing
to Europe/USA/Canada/… buckets).

## Fix (smallest focused change)

In `locationFacets()`, split each raw location on commas and count each trimmed
part as its own facet (skipping empty and location-agnostic parts). No changes
to filter semantics, chips markup, datalist markup, or the worker.

Effects:
- Datalist offers individual regions (Europe, USA, Canada, UK, LATAM, APAC, …).
- "Locations:" chips become per-region with true counts; clicking "Canada"
  substring-filters to every listing that admits Canada (existing behavior).

## Non-goals

- No geocoding/normalization (e.g. "USA timezones" stays its own token).
- No changes to isLocationAgnostic, sort, or the anywhere-matches tier (R195).
- No upstream/worker changes.

## Validation

- `npx tsc -b --noEmit`, `npx eslint src/lib/jobs.ts src/pages/Jobs.tsx`,
  `npm run build`, `npm run verify-dist`.

## Production QA matrix

1. /jobs datalist options are individual regions, deduped, no compound strings.
2. "Locations:" chips show per-region labels with counts ≥ compound-era counts
   (e.g. Europe counts every listing containing Europe).
3. Clicking the "Canada" chip filters to all listings admitting Canada +
   worldwide tier below (R195 semantics intact); clicking again clears.
4. Typing `Canada` manually gives the same result set as the chip.
5. `?loc=` URL round-trip still works.
6. 375px: chips row wraps with zero horizontal overflow.
7. Clean up synthetic storage after QA.
