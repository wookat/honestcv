# R118 — References library: save a polished reference once, reuse it across resume copies

## First-hand evidence (2026-08-31)

- Rezi resume editor, References tab (`~/audit-r1/shots-r118/references.png|.txt`,
  captured this round): each reference entry has a first-class
  **"SAVE TO REFERENCES LIST"** action (fields: name*, phone, email*, type
  Personal/Professional, employer, job title).
- Our structured references section (R72: name, title, employer, email, phone,
  kind) has no way to reuse a polished entry in another resume copy.
- The Certifications and Publications tabs still do not appear in this sample
  resume's section list, so those libraries remain deferred pending fresh
  first-hand evidence of their editors.

## Design

Mirror the R115–R117 structured-library pattern 1:1.

- `resume.ts`: `SavedReference { id, savedAt, data: ReferenceItem }`,
  key `honestcv.referenceLibrary`, max 30, newest first.
  `sanitizeReferenceItem` keeps all six required fields (five strings with
  empty strings preserved; `kind` whitelisted to ''|'personal'|'professional')
  and rejects an entry only when `name`, `employer` and `email` are all blank.
  Malformed JSON / non-array / rows missing outer `id` or a numeric `savedAt`
  are silently dropped; localStorage failures are ignored (fail closed).
- `Builder.tsx` References section: per-entry BookmarkPlus save button
  (disabled when name+employer+email blank, green check 1.6 s),
  `From library (n)` toggle beside "Add reference" (hidden when empty),
  panel rows show truncated `name — employer` (fallback "Untitled reference")
  + saved date, Insert (fresh id, replaces all-blank placeholders, appends
  otherwise) and Delete, 40px mobile controls.

## Non-goals

No schema/AI/scoring/export/Worker changes; no cross-device sync.
Certifications/Publications libraries stay deferred (no editor evidence).

## Validation

Local lint + tsc + build green; deploy; production QA via testing agent
(save/insert/delete/persistence/kind-whitelist/malformed-data/regression of
eight existing libraries/375px/console/zero AI calls/byte-exact restore).
