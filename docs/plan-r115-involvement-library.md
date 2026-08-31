# R115 — Involvement library: save a polished involvement entry once, reuse it across resume copies

## First-hand evidence (2026-08-31)

- Rezi resume editor, Involvement tab (`~/audit-r1/shots-r114/involvement.png|.txt`,
  captured during the R114 audit): each involvement entry has a first-class
  **"SAVE TO INVOLVEMENT LIST"** action — the same save-for-reuse pattern as
  experience (R99), education (R111), skills (R112), summary (R113) and projects
  (R114). This is the last per-section save-to-list still missing on our side for a
  section both products share.
- Our structured involvement section (R68: role, organization, location, dates,
  description) has no way to reuse a polished entry in another resume copy.

## Design

Mirror the R111/R114 structured-library pattern 1:1:

- `resume.ts`:
  - `interface SavedInvolvement { id: string; savedAt: number; data: InvolvementItem }`
  - new localStorage key `honestcv.involvementLibrary`, max 30, newest first
  - `sanitizeInvolvementItem` copies all seven string fields via `asStr`; an entry
    with blank role, organization and description is rejected
  - `listInvolvementLibrary()`, `saveInvolvementToLibrary(entry)`,
    `deleteLibraryInvolvement(id)`
  - same fail-closed handling: malformed JSON / non-array / rows missing `id` or a
    numeric `savedAt` are silently dropped; storage failures ignored
- `Builder.tsx` Involvement section:
  - per-entry BookmarkPlus "Save involvement N to library" button (disabled when
    role, organization and description are all blank; green check flash 1.6 s)
  - "From library (n)" toggle beside "Add involvement", hidden when the library is
    empty; rows show "role — organization" truncated + saved date, with Insert /
    Delete (h-10 mobile / sm:h-7 desktop)
  - Insert appends a new entry with a fresh id, replacing a single all-blank
    placeholder entry if that is all the section contains

Non-goals: no schema/AI/scoring/export/Worker changes; certifications and other
sections deferred pending fresh first-hand evidence; no cross-device sync.
