# R308 — Location autocomplete on the jobs board

## First-party evidence (Rezi)

Rezi changelog, Updates August 2026 · Week 4 · Rezi Web App
(https://www.rezi.ai/rezi-changelog):

> "Faster Job Location Entry: New location autocomplete feature for quick,
> accurate job location search."

and Week 3:

> "Smarter Job Location Search: Location preferences now prioritized based on
> your specific input for more relevant results."

## Our current state (source + production)

- `/jobs` location filter is a free-text `<Input type="search">`
  (`src/pages/Jobs.tsx`) matched by `includes()` against `job.location`.
- R267 facet chips (`locationFacets`, cap 8) surface only the 8 most common
  locations in the *current* result set — long-tail locations (e.g. a single
  Berlin posting) get no discovery affordance; the user must guess the exact
  spelling.
- Prioritized input-based matching already exists (R195 direct matches first,
  location-agnostic postings after).

## Gap

No type-ahead: typing "ber" gives no suggestion that "Berlin, Germany" exists
in the listings. Rezi ships exactly this affordance.

## Design (narrow)

Native `<datalist>` autocomplete on the location input:

- Options = every distinct location across the current search results **and**
  tracked pipeline jobs, deduped case-insensitively, alphabetical, uncapped.
  Location-agnostic strings (`Remote`, `Worldwide`, `Anywhere`…) excluded —
  they match any filter anyway (same rule as the facets).
- Reuse `locationFacets()` (pass `Infinity` cap) — no new matching logic.
- Zero behavior change to filtering, sorting, facets, or the
  location-agnostic split. No worker/schema/storage changes.

Native datalist is the mature mainstream mechanism (built-in keyboard/mobile
support, zero dependencies, ATS-style select-or-type freedom).

## Verification

- Oracle: `locationFacets` uncapped dedupe/order semantics.
- `npx tsc -b`, eslint on changed files, `npm run build`.
- Deploy; testing-agent production QA: suggestions appear while typing,
  picking one filters exactly like typing it, agnostic locations absent from
  options, facets/prioritized-split regression, 375px strict width, dark
  mode, baseline restoration, zero AI calls.
