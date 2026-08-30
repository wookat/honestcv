# R70 — Structured Awards & Honors section

## Firsthand evidence (2026-08-29, logged-in Rezi audit)

- `~/audit-r1/shots-r70/rezi-academic-submenu.png` — Rezi's optional-sections menu has an
  **Academic ›** submenu with **Awards & Honors** and **Publications** (both PRO-gated).
- `~/audit-r1/shots-r70/rezi-awards-route.png` — the Awards & Honors editor is fully
  structured: *What was the award NAME?* (required), *Which ORGANIZATION gave you the
  award?* (required), *WHEN did you get the award?* (year), *How is the award RELEVANT?*
  (bullet description), plus a Save-to-list control and a Sort-by-date toggle.
- `~/audit-r1/shots-r70/rezi-other-submenu.png` — **Other ›** holds References / Military
  Service / Agents (all PRO); not selected this round.

## Gap

RezUp has no awards primitive. Award data can only live in a custom section
(title + flat bullets): no per-award organization/date, no consistent formatting across
Preview/PDF/DOCX/TXT/Markdown, and imports can't target structured fields. Rezi charges
$29/mo for this; we ship it free.

## Design

```ts
export interface AwardItem {
  id: string
  name: string          // award or honor name
  organization: string  // which organization gave the award
  date: string          // when it was received, e.g. "2026"
  description: string   // how the award is relevant; one bullet per line
}
interface Resume { awards?: AwardItem[] }  // optional — legacy resumes unaffected
```

- No new storage key; `awards` lives inside `honestcv.resume` and is sanitized with the
  existing `asObjArr`/`asStr` helpers.
- `SECTION_KEYS` gains `'awards'` after `certifications` (fresh defaults); resumes with a
  saved `sectionOrder` get it appended by `orderedSectionKeys` (same behavior as
  R68 involvement / R69 coursework — user order is never rewritten).
- Canonical helpers (single source of truth for all render paths):
  - `awardEntries(r)` — entries with a non-empty name or organization
  - `awardHeadingLine(a)` — `name — organization` (certification style)
  - `awardBullets(a)` — non-empty trimmed description lines
- Rendering: Preview + PDF use the experience-style bold heading with right-aligned
  italic date; DOCX/TXT/Markdown flatteners reuse the same helpers.
- Builder: "Awards & honors" section after Coursework with name / organization / date
  inputs, description textarea (one bullet per line), Add/Delete controls at ~40px on
  mobile.

## Non-goals

- Rezi's Sort-by-date toggle and cross-resume award list (not copying storage model).
- Publications / References / Military Service / Agents (separate rounds, if prioritized).
- No new API, dependency, storage key, or import-mapping changes.
