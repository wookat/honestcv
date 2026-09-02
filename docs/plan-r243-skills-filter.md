# R243 — skills filter on the jobs board

## Rezi first-party evidence

Job Search guide (rezi.ai/rezi-docs/job-search), step 2 "Search for roles":

> "And to narrow things down, Rezi gives you these filters: Workplace Type
> (remote, on-site) · Job Type (full-time, part-time) · Visa Sponsorship · Skills"

and the Job Search Map teaser: "discover opportunities by location, role, and skill".

## Current state

- After R242 the board filters by category, job type, location, and status
  exclusions — Skills is the last Rezi filter with data to support it (every
  listing carries a full plain-text description; skills appear there and in
  titles). Visa Sponsorship remains out (not in the upstream data).
- The Remotive search `q` matches broadly; there is no way to require several
  specific skills at once (e.g. "react, typescript").

## Design (deterministic, client-side, zero AI)

- New session-scoped `skillsFilter` text input next to the location filter,
  placeholder `Skills, e.g. React, SQL`.
- Parsed as comma-separated terms (trimmed, empties dropped). On the All tab
  only, applied after the type filter and before the location split: a job is
  kept iff EVERY term matches `title + description` case-insensitively.
  Word-boundary regex when the term starts/ends with a word character (so
  `java` doesn't match JavaScript); plain substring otherwise (so `c++`,
  `.net` still work). Regex-special characters escaped.
- Composes with category/type/location/exclusions/sort; tracked/status tabs
  unaffected. No persistence, worker, schema, scoring, or AI changes.

## Validation

- Live search: `react` narrows; `react, typescript` narrows further; every
  shown description/title contains both terms; clearing restores.
- Fixture: `java` does NOT match a JavaScript-only job (word boundary); `c++`
  matches literally; multiple terms are AND, not OR; case-insensitive.
- Composes with type + location + Hide exclusions + newest sort; tracked tabs
  ignore it.
- 375px + dark mode; zero /api/ai calls.
