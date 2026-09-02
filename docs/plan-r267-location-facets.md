# R267 — location facets on the jobs board

## Rezi first-party evidence

- Job Search guide (rezi.ai/rezi-docs/job-search, updated 2026-07-16):
  > "Want a better view of the job market? You can also explore the Rezi Job
  > Search Map to discover opportunities by location, role, and skill before
  > you send your next application."
- Same guide, step 2: search "using keywords, job titles, or locations, then
  refine results with filters and sorting options".
- Changelog (July 28) mentions the map shipping publicly: "Fixed a display
  error affecting job list items on the map", "Fixed display issues on the
  job map" — location-based discovery is a live, first-party surface.
- Job Search landing tip: "What salary range keeps showing up? …" — Rezi
  coaches users to look for patterns across listings before applying.

## Current state

- `/jobs` has a free-text location input ("Location, e.g. Europe") that
  splits results into direct matches + location-agnostic postings (R195).
- But the input is a blind guess: nothing tells the user which candidate
  locations actually exist in the current result set, or how many postings
  each one has. Discovery-by-location — the capability the Rezi map serves —
  has no entry point.
- Every listing already carries `location` from Remotive
  (`candidate_required_location`, e.g. "Europe", "USA Only", "Worldwide").
  Live data (2026-08-31, q=engineer): a dozen distinct region strings.

## Change (narrowest useful slice)

- `src/lib/jobs.ts`: export the existing `isLocationAgnostic` helper (moved
  verbatim from Jobs.tsx) + new pure `locationFacets(locations, cap = 8)`:
  skip agnostic strings, group case-insensitively (label = first-seen
  casing), count per location, sort count desc then label asc, cap 8.
- `Jobs.tsx` (All tab only): compute facets from the pre-location-filter
  list (after search/category/type/skills/exclusions) so the bar stays
  stable while a facet is active. Render a "Locations:" chip row under the
  filter toolbar — `<label> (<count>)` buttons, `aria-pressed`, click sets
  the location input to the label, clicking the active chip clears it.
- No worker/schema/scoring/AI/persistence changes. No literal map: Remotive
  locations are region strings, not coordinates — a facet bar is the honest
  version of discover-by-location for this data.

## Non-goals

- No geographic map rendering, no geocoding.
- No changes to the direct/anywhere split semantics (R195).
- No new filters beyond the existing location input.

## Verification

- tsx oracle: grouping (case-insensitive, first-seen casing), agnostic
  exclusion ('', 'Remote', Worldwide/anywhere/global), count-desc then
  alpha sort, cap 8.
- Production: chip row matches live payload recount; click filters + splits
  list (R195 semantics unchanged); active chip toggles off; combines with
  type/skills filters; Tracked/status tabs unaffected; 375px; dark mode
  contrast; zero /api/ai calls.
