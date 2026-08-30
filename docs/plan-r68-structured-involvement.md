# R68: Structured Involvement section

## Evidence (first-hand, 2026-08-29)

- `~/audit-r1/shots-r67/rezi-involvement.png` — Rezi's Involvement editor
  (route `/dashboard/resume/<id>/involvement`, enabled via the `···` section
  menu, see `rezi-tab-overflow.png`) is fully structured:
  - `WHAT WAS YOUR ROLE AT THE ORGANIZATION? *` (e.g. "Selected Member")
  - `FOR WHICH ORGANIZATION DID YOU WORK? *` (e.g. "Economics Student Association")
  - `HOW LONG WERE YOU WITH THE ORGANIZATION?` (start – end month/year range)
  - `AT WHICH COLLEGE WAS THE ORGANIZATION LOCATED?` (location)
  - `WHAT DID YOU DO AT THE ORGANIZATION?` (bullet-style description)
  - Entry sidebar with `+`, `Sort by date` toggle, `SAVE TO INVOLVEMENT LIST`.

## Gap

RezUp has no involvement/volunteering section. Custom sections are
title + flat bullets only — they cannot express role/organization/dates with
experience-style rendering (right-aligned dates, bold heading line). Students
and career changers (the same audience as Projects, R66) cannot represent
campus/community involvement properly.

## Design

New optional built-in section, mirroring the Experience render treatment:

```ts
interface InvolvementItem {
  id: string
  role: string
  organization: string
  location: string   // college/city
  startDate: string
  endDate: string
  description: string // one bullet per line
}
interface Resume { involvement?: InvolvementItem[] }
```

- `SECTION_KEYS` gains `'involvement'` after `'projects'`; `orderedSectionKeys`
  already appends new built-in keys for legacy stored orders, and an empty
  section renders nothing, so old resumes are unaffected.
- Helpers (single source of truth): `involvementEntries(r)` (entries with any
  role/organization), `involvementHeadingLine(i)` = `role · organization, location`
  (empty parts skipped), `involvementDates(i)` = `start – end`.
- Rendering: Preview + PDF use the experience pattern (bold heading line,
  right-aligned italic dates, description lines as bullets); DOCX mirrors the
  experience paragraph; TXT/MD emit heading + `(dates)` + `- bullet` lines.
- Builder: new "Involvement" section card (Role / Organization / Location /
  Start / End inputs + description textarea, one bullet per line;
  Add/Delete with 40px mobile touch targets per R67.1).

## Non-goals

- No Sort-by-date toggle (manual order is the existing convention).
- No cross-resume "save to involvement list" library (per-resume copies +
  folders already cover it).
- No importText/resumeCenter mapping changes.
- No Coursework section this round (evidence in hand, ranked next).
- No new API, storage key, or dependency.

## Acceptance

- Entry (role "Selected Member", org "Economics Student Association",
  location "UW–Madison", dates "Aug 2024 – May 2026", two description lines)
  renders in Preview/PDF as a bold heading with right-aligned italic dates and
  two bullets; empty fields leave no dangling separators.
- Legacy resumes (no `involvement` key) load and render unchanged.
- Section reorder UI includes Involvement; hidden when empty.
- `npm run lint`, `npx tsc -b`, `npm run build` green; production QA at
  1440px + 375px (≥40px touch targets, no overflow, console clean,
  localStorage byte-level restore), R65–R67 regression.
