# R86: Sort by date for Experience and Education entries

## Evidence (first-hand, 2026-08-29)

Fresh logged-in audit of app.rezi.ai (`~/audit-r1/shots-r86/`):

- `rezi-experience.png` + `experience-text.txt`: the Experience sidebar ends with a
  **"Sort by date"** toggle (on by default), below "Drag to rearrange".
- `rezi-education.png`: the Education sidebar has the same "Sort by date" toggle.

This gap has been deliberately deferred since R68 ("刻意不做：Sort by date") while the
structured-section rounds landed. It is now the highest-value small batch: users who
import (LinkedIn / PDF upload) or paste roles out of order have no one-click way to get
the recruiter-expected reverse-chronological order — only manual drag / arrow moves.

## Current state (ours)

- `ExperienceItem` and `EducationItem` both have free-text `startDate` / `endDate`
  (e.g. "Jun 2023", "Present", "2019").
- Builder supports per-entry drag reorder + move up/down arrows; nothing date-aware.

## Design

One-click **"Sort by date"** button (not a persistent toggle) at the top of the
Experience and Education sections, shown when the section has ≥ 2 entries:

- A toggle would need a new persisted resume field and would silently fight drag
  reorder; a one-shot action keeps manual ordering authoritative and adds zero schema.
- Pure helpers in `src/lib/resume.ts`:
  - `dateSortValue(text)`: extracts a `year*12+month` ordinal from free text
    (month names or `MM/`-style numerics; month unknown → mid-year). No year → `null`.
  - `sortEntriesByDate(items, startOf, endOf)`: stable sort, newest first.
    Ongoing entries (`present|current|now|ongoing` end date) first, ranked by start
    date; then by end date (falling back to start date) descending; entries with no
    parseable date keep their relative order at the end. Already-sorted input is a
    no-op (stable).
- Builder wires the button to `setResume` for `experience` and `education` — flows
  through the existing autosave/history, so a sort is undoable via edit history.

## Not doing

- Persistent auto-sort toggle (schema + fights manual ordering).
- Sorting other sections (projects/involvement/military have dates but small n and
  users often curate order; candidate for a later round if evidence demands).
- Any change to preview/PDF/DOCX rendering, scoring, storage keys, AI.

## Verification

Local: lint, tsc -b, build, diff --check.
Production QA: out-of-order example entries sort newest-first with Present on top;
undated entry sinks to bottom keeping relative order; sort is stable/idempotent on a
second click; drag reorder still works after sorting; Education same; 375px button
≥40px touch target, no overflow; console clean; zero AI calls; localStorage restored.
