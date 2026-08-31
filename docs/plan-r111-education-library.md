# R111 — Education library: save a degree once, reuse it across resume copies

## First-hand evidence (2026-08-29)

- Rezi resume editor, Education tab (`app.rezi.ai/dashboard/resume/<id>/education`,
  captured in `~/audit-r1/shots-r111/education.png|txt`): every education entry has a
  first-class **"SAVE TO EDUCATION LIST"** action, exactly parallel to the
  "SAVE TO EXPERIENCE LIST" action we matched in R99. The Skills tab likewise shows
  "SAVE TO SKILLS LIST".
- Our product (cv.zalize.com/builder): R99 shipped a per-entry library for **experience
  only** (`honestcv.experienceLibrary`, bookmark button + "From library (n)" panel).
  Education entries have Move/Duplicate/Delete but no way to reuse a polished degree
  entry (school, dates, GPA, minor, honors line) in another resume copy — users must
  retype it per copy.

Ruled out this round (first-hand): custom sections, drag reorder, weak-verb /
quantified-bullet checks, contact fields, version history, keyword targeting are all
already covered. Profile picture stays deferred (Rezi Pro-gated). Skills reuse is
lower value for us because our skills are free-text lines, not structured entries —
revisit only if evidence shows demand.

## Design

Mirror the R99 pattern 1:1 so behavior stays predictable:

- `resume.ts`:
  - `interface SavedEducation { id: string; savedAt: number; data: EducationItem }`
  - new localStorage key `honestcv.educationLibrary`, max 30, newest first
  - `sanitizeEducationItem` (drop entries with no school/degree/details),
    `listEducationLibrary()`, `saveEducationToLibrary(entry)`,
    `deleteLibraryEducation(id)` — bad data silently dropped, storage errors ignored
- `Builder.tsx` Education section:
  - per-entry BookmarkPlus button (disabled when school+degree+details all blank;
    green check flash 1.6 s after save), placed with the existing entry controls
  - "From library (n)" toggle next to "Add education" (hidden when empty), panel rows
    show "Degree — School" + saved date with Insert / Delete
  - Insert appends with a fresh id and drops fully-empty placeholder entries

Non-goals: no schema/AI/scoring/endpoint changes; no skills library; no cross-device
sync (library is local, same as R99).

## Acceptance

`npm run lint` (0 errors) + `npx tsc -b` + `npm run build`; deploy; production QA:
save/insert/delete across two copies, GPA/minor/details fidelity, empty-entry guard,
R99 experience library regression, 375 px layout, console clean, zero AI calls,
localStorage restored byte-for-byte.
