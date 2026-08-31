# R114 — Project library: save a polished project once, reuse it across resume copies

## First-hand evidence (2026-08-29)

- Rezi resume editor, Projects tab (`~/audit-r1/shots-r114/projects.png|.txt`): each
  project entry has a first-class **"SAVE TO PROJECT LIST"** action — the same
  save-for-reuse pattern as experience (R99), education (R111), skills (R112) and
  summary (R113). The same audit shows "SAVE TO INVOLVEMENT LIST" on the Involvement
  tab (deferred to a later round to keep this batch small).
- Our structured projects section (R66: name, link, org, dates, description) has no
  way to reuse a polished project entry in another resume copy.

## Design

Mirror the R111 education-library pattern 1:1 (a project is a structured entry):

- `resume.ts`:
  - `interface SavedProject { id: string; savedAt: number; data: ProjectItem }`
  - new localStorage key `honestcv.projectLibrary`, max 30, newest first
  - `sanitizeProjectItem` keeps `org`/`startDate`/`endDate` only when non-empty
    (optional fields stay absent, matching the gpa/minor convention); an entry with
    blank name, link and description is rejected
  - `listProjectLibrary()`, `saveProjectToLibrary(entry)`, `deleteLibraryProject(id)`
  - same fail-closed handling: malformed JSON / non-array / rows missing `id` or
    numeric `savedAt` are silently dropped; storage failures ignored
- `Builder.tsx` Projects section:
  - per-entry BookmarkPlus "Save project N to library" button (disabled when the
    entry is entirely blank; green check flash 1.6 s)
  - "From library (n)" toggle hidden when the library is empty; rows show the
    project name (or first description line) truncated + saved date, with Insert /
    Delete (h-10 mobile / sm:h-7 desktop)
  - Insert appends a new entry with a fresh id, replacing a single all-blank
    placeholder entry if that is all the section contains (same as R99/R111)

Non-goals: no schema/AI/scoring/export changes; no involvement/certification
libraries this round; no cross-device sync.
