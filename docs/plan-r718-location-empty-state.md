# R718 — Location filter: truthful empty state, no stale detail row, more places known

## Why

First-hand production evidence (2026-09-06, `qa/r718-evidence.cjs`, index-CNwlb5ou.js):

- `/jobs?q=nurse&loc=Bath` → list header "0 jobs found", empty state "No jobs found —
  try another search term", **detail pane still shows "Part Time Remote Psychiatric Nurse
  Practitioner"** — a row the filter has hidden. `selected` fell through
  `shown.find(...)` to `jobs.find(...)`, and `fetchJobs` always auto-picked `list[0]`
  regardless of the typed place.
- The empty text was wrong twice over: the search *did* find nurse jobs (26), none of them
  in Bath or open to the UK; and "try another search term" points at the wrong control —
  the location is what excludes everything.
- `Bath`, `SF`, `Atlanta`, `Reading`, … were not in `CITY_COUNTRY`, so postings labelled
  `UK` / `USA` could not be offered as the "wider" tier for them (R716 left "Bath" as an
  example of an unknown place). Unknown places had no explanation either.
- `/jobs?q=nurse&loc=Chicago` → 19 rows all under "Open to USA / Americas (19)" — the
  header reads as a sub-group although it is the whole list; nothing says that no posting
  names Chicago.

## Change (client only, `src/lib/jobs.ts` + `src/pages/Jobs.tsx`; API / storage untouched)

- `fetchJobs`: with a location typed, the auto-pick after a fetch is the first row whose
  `locationTier(...)` is non-null, or **nothing** when none is; a kept selection is only
  kept when it is explicit (deep link / user click), tracked, or still in place.
  Selection when no location is typed is unchanged (`list[0]`).
- Empty state when the query found rows but the place hides them all:
  "None of the N jobs for “q” is in <place> or open to <UK / Europe / EMEA>." + **Clear
  location** (keeps the query); unknown places instead get "…names <place>, and we don't
  know which country it is in — postings open to a whole country or region can't be
  matched to it. Try its country instead (for example “UK”)." The existing
  "Clear search & filters" button stays.
- Tier header at the top of the list (no direct rows) reads "Nothing names <place> itself —
  open to UK / Europe / EMEA (N)" / "… open to any location (N)"; below direct rows it is
  the R716 "Open to …" text.
- `isKnownPlace(place)` (country or region resolvable) exported for the empty state;
  `CITY_COUNTRY` +60 cities (UK: Bath, Sheffield, Liverpool, … / US: Atlanta, Dallas,
  Miami, Portland, … / Toronto, Sydney, Tokyo, Bangalore, …); `sf` ↔ `san francisco`.

## Verification

- `npx tsx --tsconfig tsconfig.app.json qa/r718-probe.mts`: `UK`/bath → wider,
  `Bath, UK`/bath → direct, `USA`/bath → null, `SF Bay Area`/sf → direct, `Ukraine`/reading
  → null; `isKnownPlace`: bath/sf/emea/ukraine true, atlantis false.
- tsc (app + worker) / eslint (only the pre-existing exhaustive-deps warning) / build /
  verify-dist green.
- Production (`qa/r718-verify.cjs 1280|375`, index-CWwPqx9V.js): `barista&Bath` → 0 cards,
  detail pane shows the "Select a job" placeholder, empty text names Bath + UK / Europe /
  EMEA, "Clear location" → 4 rows, first selected, URL `?q=barista`; `engineer&Atlantis`
  → header "Nothing names Atlantis itself — open to any location (11)"; `nurse&Chicago`
  → "Nothing names Chicago itself — open to USA / Americas (19)"; live typing "Bath" on
  `nurse` (26 rows, remote row selected) → 2 rows, panel switches to a UK row; clearing
  → 26 rows; deep link `&job=<remote id>&loc=Bath` keeps the linked job. Both widths:
  overflow 0, 0 console errors, storage back to baseline.

## Honest limits

- `nurse&Bath` now returns 2 Sona "Europe, UK" rows (feed changed since the first probe),
  so the zero case was verified with `barista&Bath`.
- A deep-linked job hidden by the location stays in the panel by design (explicit request);
  nothing yet says "this job is not in <place>".
- The empty state does not list where the found rows actually are (the existing Locations
  facets above the list already do).
- The unknown-place hint is heuristic wording; `CITY_COUNTRY` is still a hand-kept list.
