# R312 — /jobs keeps your place: filter/tab/selection state in the URL

## Evidence (first-party)
- Rezi changelog, August 2026 Week 4 (https://www.rezi.ai/rezi-changelog): "Seamless
  Messaging Navigation: Navigate to messages or refresh the page without losing your
  place" — Rezi treats losing job-search context on refresh/navigation as a defect.
- Our production /jobs (source: Jobs.tsx): the page *reads* two seed params
  (`?attention=1`, `?q=`) but never writes state back. Verified in source: `tab`,
  `query`, `category`, `locationFilter`, `typeFilter`, `skillsFilter`, `sort`,
  `selectedId` are plain `useState` — a refresh, an accidental navigation, or
  sharing the URL loses every filter and the selected job. Reproduced on production:
  set filters + select a job, reload → back to defaults.

## Design
Two-way sync between the /jobs UI state and the query string, no new UI:

1. Seeding (initial state): parse `window.location.search` once —
   - `tab` ∈ {all, tracked, saved, applied, interviewing, offer, rejected}
   - `q` (now honored even when present-but-empty, so a cleared search survives
     reload; absent keeps the existing `targetRole` default)
   - `cat`, `loc`, `type`, `skills`, `sort` ∈ {newest, match}, `job` (listing id)
   - existing `attention=1` behavior unchanged (forces tracked + follow-up filter)
2. Writing: one `useEffect` serializes the same state to the query string and calls
   `history.replaceState` (no history spam, Back keeps working per-page). Defaults
   are omitted so the pristine URL stays `/jobs`; `q` is written only when it
   differs from the default seed (empty default → non-empty q, or vice versa
   `q=` present-but-empty).
3. Selection: `?job=` seeds `selectedId`; the fetch effect keeps `cur ?? first`
   semantics so a stale id (job no longer in results) falls back visibly rather
   than showing an empty pane. Selected id is only written for the All tab list
   or tracked entries (any id we can restore).

No worker/API/schema/storage changes; filtering/sorting semantics byte-identical.

## Verification
- `npx tsc -b`, eslint Jobs.tsx, `npm run build`.
- Deploy + curl bundle; testing-agent production QA: set query/filters/sort/tab/
  selection → reload restores all; ?attention=1 and ?q= deep links regression;
  clean URL at defaults; 375px strict width; dark mode; zero AI calls; baseline
  restore.
