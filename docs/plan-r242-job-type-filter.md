# R242 — job type filter on the jobs board

## Rezi first-party evidence

Job Search guide (rezi.ai/rezi-docs/job-search), step 2 "Search for roles":

> "And to narrow things down, Rezi gives you these filters: Workplace Type
> (remote, on-site) · Job Type (full-time, part-time) · Visa Sponsorship · Skills"

## Current state

- `/jobs` has search + category + location filters, status exclusions, and
  relevance/newest/match sorting — but no Job Type filter.
- Every listing already carries `type` from Remotive's `job_type`
  (`full_time` → "full time"); the worker normalizes underscores to spaces.
- Live data (2026-09-02, q=engineer, 18 jobs): full time ×11, contract ×3,
  part time ×2, freelance ×2 — the field is populated and discriminating.
- Workplace Type is not a meaningful filter here (Remotive is remote-only);
  Visa Sponsorship isn't in the upstream data. Job Type is the one filter that
  maps cleanly onto data we already have.

## Design (deterministic, client-side, zero AI)

- New `typeFilter` state in Jobs.tsx (`''` = all). `<select>` next to the
  category filter with Remotive's canonical job types: Full time, Part time,
  Contract, Freelance, Internship, Other.
- Applied on the All tab only (like exclusions/location), after status
  exclusions: keep jobs whose `type.toLowerCase()` equals the selected value.
  Jobs with an empty `type` are hidden by any specific selection.
- Session-scoped; no persistence, no worker/schema/scoring changes, tracked
  tabs unaffected.

## Validation

- Selecting "Contract" on a live search shows only contract rows; "All types"
  restores the full list; combining with location/exclusions/sort still works.
- Fixture with an empty-type job: hidden under any specific type, shown under All.
- Tracked/status tabs ignore the filter.
- 375px + dark mode; ATS regression; zero /api/ai calls.
