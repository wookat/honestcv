# R116 — Coursework library: save a polished coursework entry once, reuse it across resume copies

## First-hand evidence (2026-08-31)

- Rezi resume editor, Coursework tab (`~/audit-r1/shots-r116/coursework.png|.txt`):
  each coursework entry has a first-class **"SAVE TO COURSEWORK LIST"** action.
- Same audit round also confirmed **"SAVE TO AWARDS & HONORS LIST"** on the Awards
  tab (`shots-r116/awards.png|.txt`) — deferred to a later round to keep this batch
  small. Certifications/Publications tabs did not render editor content in this
  capture (nav-only innerText), so no claim is made about them.
- Our structured coursework section (R69: name, institution, date, skill,
  description) has no way to reuse a polished entry in another resume copy.

## Design

Mirror the R115 involvement-library pattern 1:1.

- `resume.ts`: `SavedCoursework { id, savedAt, data: CourseworkItem }`,
  key `honestcv.courseworkLibrary`, max 30, newest first.
  `sanitizeCourseworkItem` keeps all six required string fields (empty strings
  preserved — no optional keys) and rejects an entry only when `name`,
  `institution` and `description` are all blank. Malformed JSON / non-array /
  rows missing outer `id` or a numeric `savedAt` are silently dropped;
  localStorage failures are ignored (fail closed, no white screen).
- `Builder.tsx` Coursework section: per-entry BookmarkPlus save button
  (disabled when name+institution+description blank, green check 1.6 s),
  `From library (n)` toggle beside "Add coursework" (hidden when empty),
  panel rows show truncated `name — institution` (fallback "Untitled course")
  + saved date, Insert (fresh id, replaces all-blank placeholders, appends
  otherwise) and Delete, 40px mobile controls.

## Non-goals

No schema/AI/scoring/export/Worker changes; no cross-device sync; Awards &
Honors library deferred to a later round.

## Validation

Local lint + tsc + build green; deploy; production QA via testing agent
(save/insert/delete/persistence/malformed-data/regression of six existing
libraries/375px/console/zero AI calls/byte-exact baseline restore).
