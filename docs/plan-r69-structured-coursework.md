# R69: Structured Coursework section

## Evidence (first-hand)

`~/audit-r1/shots-r67/rezi-coursework.png` — logged-in Rezi editor, Coursework tab:

- WHAT WAS THE COURSE **NAME**? * (e.g. "Introduction to Computer Systems")
- **WHERE** DID YOU TAKE THE COURSE? (e.g. "University of Wisconsin, Madison")
- **WHEN** DID YOU TAKE THE COURSE? (e.g. "2026")
- WHAT **SKILL** DID YOU USE? (e.g. "Teamwork")
- HOW WAS THAT SKILL **APPLIED**? (bullet-style textarea)
- Entry list sidebar + add control + "Sort by date" toggle + SAVE TO COURSEWORK LIST.

## Gap

RezUp has no coursework primitive. Students / new grads (the same audience Rezi targets
with this section) can only shoehorn courses into the free-text Education `details` line
or a flat custom section — no course-level dates, institution, or bullets, and no
consistent rendering across exports.

## Design

Mirror the R68 Involvement pattern exactly (per-resume data, optional key, shared helpers):

```ts
export interface CourseworkItem {
  id: string
  name: string        // course name
  institution: string // where taken
  date: string        // when taken, free text e.g. "2026"
  skill: string       // skill used (optional)
  description: string // how it was applied; one bullet per line
}
interface Resume { coursework?: CourseworkItem[] }
```

- `SECTION_KEYS`: `'coursework'` after `'education'` (it is education-adjacent);
  legacy stored `sectionOrder` gets it appended by `orderedSectionKeys` (never
  reorders a user's saved order). Empty section renders nothing.
- Sanitization via existing `asObjArr`/`asStr`.
- Single source of truth in `resume.ts`:
  - `courseworkEntries(r)` — items with a non-empty name or institution
  - `courseworkHeadingLine(c)` — `name  ·  institution`
  - `courseworkBullets(c)` — `Skill: <skill>` line (when set) + non-empty description lines
  - date shown via the existing right-aligned italic slot (single date, no range)
- Rendering: Preview + PDF bold heading + right-aligned italic date + accent bullets;
  DOCX same tab-stop paragraph; TXT/MD heading + `(date)` + `- bullet` lines.
- Builder: "Coursework" card after Education — Course name / Institution / When inputs,
  Skill input, description textarea, Add/Delete with 40px mobile touch targets.

## Non-goals

- Rezi's Sort-by-date toggle and cross-resume "coursework list" library (manual order
  and per-resume localStorage are the existing conventions).
- Import (importText/resumeCenter) mapping changes.
- No new API, dependency, or storage key.

## Acceptance

- `npm run lint` (0 errors), `npx tsc -b`, `npm run build` green.
- Production QA at 1440px + 375px: add/edit/delete, empty-field separators, reload
  persistence, PDF text extraction, section order list, legacy resume unaffected,
  R65–R68 regression, no overflow, 40px touch targets, console clean, zero AI calls,
  byte-identical localStorage restore.
