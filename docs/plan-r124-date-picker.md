# R124 — Month/year picker for date fields

## Evidence (Rezi re-audit, 2026-08-31, logged-in editor)

- Rezi's Experience editor date fields ("How long were you with Acme Corp?")
  open a month + year picker popover on focus: a year header with ‹ › arrows
  and a 12-month button grid (screenshot `~/screenshots/ss_5911f5ef.png`,
  DOM confirms `<h2>2026</h2>` + `<button>January…December</button>`).
- The input remains a text input — picking a month writes "August 2026" into
  the field; typing stays possible.
- Rezi's entry checklist flags "Dates are missing" — consistent, parseable
  dates are treated as an ATS-critical field.

## Gap in RezUp

All date fields in the Builder (Experience, Education, Projects, Involvement,
Military — 10 inputs total) are plain free-text `<Input>`s. Users produce
inconsistent formats ("2023-6", "06/23", "june"), which weakens the
employment-dates ATS check and the past-tense consistency check (which keys
off `endDate` matching /present|current/i).

## Design

New `MonthYearField` component (custom popover, same outside-click/Escape
pattern as `ResourcesDropdown` — no new dependency; repo has no Radix
popover):

- Text input unchanged (same value/onChange contract, free typing preserved;
  zero schema change — dates stay plain strings).
- Calendar toggle button inside the field opens a popover: year header with
  ‹ › arrows + 12 short-month buttons; picking writes "Jun 2023" style.
- End-date fields additionally offer a "Present" quick action.
- Initial year parsed from the current value when present, else current year.
- Buttons keep ≥40px touch targets at mobile widths.

Swap the 10 start/end date inputs in Builder to `MonthYearField`
(`allowPresent` on the 5 end fields).

## Out of scope

- No schema change (dates remain free strings; import paths untouched).
- No day-level picker (resumes are month-granular).
- No validation/normalization of already-typed values.

## Acceptance

- Lint/build green locally.
- Picker opens/closes (outside click + Escape), writes "Jun 2023" / "Present".
- Typing still works and persists.
- 1440 + 375 viewports: popover stays in view, no horizontal overflow,
  month buttons keep usable touch targets.
