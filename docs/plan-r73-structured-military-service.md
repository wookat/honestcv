# R73 — Structured Military Service section

## Firsthand evidence (Rezi, logged-in)

`~/audit-r1/shots-r71/rezi-military.png` (route `/dashboard/resume/<id>/military`,
captured during the R71 audit round; PRO-gated in Rezi at $29/mo — free here):

- WHAT WAS YOUR **RANK OR POSITION** AT THE ORGANIZATION? * (e.g. "Sergeant, Captain, Intelligence Officer, Squad Leader")
- FOR WHICH **BRANCH** DID YOU SERVE? * (e.g. "Army, Navy, Air Force, Marine Corps")
- HOW **LONG** DID YOU SERVE? (start – end range)
- **WHERE** WERE YOU STATIONED? (e.g. "Fort Bragg, NC")
- WHAT WERE YOUR **RESPONSIBILITIES AND ACCOMPLISHMENTS** (bullet-style description)
- SAVE TO MILITARY SERVICE LIST / Sort by date

We have no military-service primitive; veterans can only flatten this into custom
sections (title + flat bullets — no rank/branch/dates/station semantics, no
experience-style rendering).

## Design

Structurally isomorphic to R68 Involvement (role/org/location/dates/bullets), so it
reuses the same conventions end to end.

- `MilitaryServiceItem { id, rank, branch, location, startDate, endDate, description }`
  (description = one bullet per line). Optional `military?: MilitaryServiceItem[]` on
  `Resume`, stored inside `honestcv.resume` (no new storage key; legacy resumes
  without the key render unchanged).
- Sanitization via `asObjArr`/`asStr` like every structured section.
- `SECTION_KEYS`: add `'military'` after `'references'`; label "Military service".
  Existing saved `sectionOrder` values get it appended last (same convention as
  R68–R72); empty section is never rendered.
- Canonical helpers (single source of truth for all five outputs):
  - `militaryEntries(r)` — entries with a rank or branch
  - `militaryHeadingLine(m)` — `rank  ·  branch, location` (empty parts dropped)
  - `militaryDates(m)` — `start – end` or `''`
  - `militaryBullets(m)` — non-empty description lines
- Outputs: preview/PDF/DOCX use the experience-style bold heading + right-aligned
  italic dates + accent bullets (identical to Involvement); TXT `MILITARY SERVICE` +
  heading + `(dates)` + `- bullet`; MD `## Military service` + `### heading *(dates)*`
  + `- bullet`.
- Builder: Military service card after References — Rank or position / Branch /
  Stationed at / Start / End + responsibilities textarea (one bullet per line),
  Add/Delete at 40px mobile touch targets.

## Non-goals

- Sort by date toggle (manual order is the established convention)
- Rezi's cross-resume "save to military service list"
- Import-mapping changes (importText/resumeCenter untouched)
- Agents section (evidence on hand at `shots-r71/rezi-agents.png`, scheduled separately)
