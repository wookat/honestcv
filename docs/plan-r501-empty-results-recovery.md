# R501 — one-click recovery from an empty job search

## Evidence (production, 2026-08-31)

- R500 made `/api/jobs/search` enforce the query locally (AND, all tokens). Honest, but
  the default `/jobs` load seeds the search box from `loadResume()?.targetRole`
  (Jobs.tsx `useState(() => seedQuery ?? loadResume()?.targetRole ?? '')`).
- With Remotive currently serving a fixed 15-job list, many common target roles now
  produce zero or near-zero results on the very first visit:
  - `Registered Nurse` → 0, `Data Analyst` → 0, `Accountant` → 0,
    `Marketing Manager` → 1, `Product Manager` → 1, `Software Engineer` → 9.
- The `all`-tab empty state is a bare paragraph: "No jobs found — try another search
  term." No one-click way back to the full list; the user must manually clear the
  search box (and any category/location/type/skills filters) themselves.
- Local facet filters (location/type/skills) and the server category filter can also
  zero out the list independently of the query.

## Fix (client-only, Jobs.tsx)

In the `tab === 'all'` empty state, when the query or any filter is active, render a
"Clear search & filters" button that resets `query`, `category`, `locationFilter`,
`typeFilter`, `skillsFilter` and reruns the search with an empty query — landing the
user on the full available list. When nothing is active (upstream genuinely returned
zero jobs), keep the bare copy.

## Non-goals

- No change to the worker or R500 matching semantics.
- No alternate jobs provider, no pagination.
- No auto-relaxing of the query (silently showing non-matching jobs would undo R500's
  honesty).

## Validation

- `npx tsc -b --noEmit`, `npx eslint src/pages/Jobs.tsx`, `npm run build`,
  `npm run verify-dist`.
- Production QA: seed an unmatchable query → empty state with button; click →
  full list, search box cleared, filters reset, URL params dropped; genuine
  empty-filters state unaffected; tracked-tab empty states unchanged.
