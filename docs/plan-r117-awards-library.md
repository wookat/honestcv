# R117 — Awards & Honors library: save a polished award entry once, reuse it across resume copies

## First-hand evidence (2026-08-31)

- Rezi resume editor, Awards & Honors tab (`~/audit-r1/shots-r116/awards.png|.txt`,
  captured during the R116 audit): each award entry has a first-class
  **"SAVE TO AWARDS & HONORS LIST"** action.
- Our structured awards section (R70: name, organization, date, description) has
  no way to reuse a polished entry in another resume copy.

## Design

Mirror the R115/R116 structured-library pattern 1:1.

- `resume.ts`: `SavedAward { id, savedAt, data: AwardItem }`,
  key `honestcv.awardLibrary`, max 30, newest first.
  `sanitizeAwardItem` keeps all five required string fields (empty strings
  preserved — no optional keys) and rejects an entry only when `name`,
  `organization` and `description` are all blank. Malformed JSON / non-array /
  rows missing outer `id` or a numeric `savedAt` are silently dropped;
  localStorage failures are ignored (fail closed, no white screen).
- `Builder.tsx` Awards & honors section: per-entry BookmarkPlus save button
  (disabled when name+organization+description blank, green check 1.6 s),
  `From library (n)` toggle beside "Add award" (hidden when empty),
  panel rows show truncated `name — organization` (fallback "Untitled award")
  + saved date, Insert (fresh id, replaces all-blank placeholders, appends
  otherwise) and Delete, 40px mobile controls.

## Non-goals

No schema/AI/scoring/export/Worker changes; no cross-device sync.
Certifications/Publications libraries deferred pending fresh first-hand
evidence of their editors (the R116 capture did not render those tabs).

## Validation

Local lint + tsc + build green; deploy; production QA via testing agent
(save/insert/delete/persistence/malformed-data/regression of seven existing
libraries/375px/console/zero AI calls/byte-exact baseline restore).
