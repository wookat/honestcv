# R99 — Experience library (save roles for reuse across resumes)

## First-hand evidence (2026-08-29, logged-in Rezi editor)

- Rezi's Experience editor has a first-class **SAVE TO EXPERIENCE LIST** button under
  each entry (`shots-r99/experience.txt`, `save-to-list.png`). Clicking it saves the
  role and shows "Changes saved" — the saved entry becomes reusable in other resumes.
- The same audit confirmed no other actionable free-tier gaps this round:
  - "Wordy Content" check → covered by our `too-long` per-line check (guidance.ts).
  - "Break" is a passive dashed page-boundary overlay in the preview
    (`break-dom.json`: `design-studio-break-page` positioned at the page height) —
    our paginated preview already renders real page splits, so nothing to copy.
  - "Version History beta" → covered by R28 edit history.
  - Finish Up toolbar → fully covered as of R93/R94; Profile picture stays Pro-gated.

## Gap

HonestCV can save whole-resume copies (`honestcv.resumeVersions`) but has no way to
keep a single polished role and drop it into another resume. Users tailoring multiple
resumes (the core Rezi workflow) must re-type or copy whole documents.

## Design

- New localStorage key `honestcv.experienceLibrary` holding
  `SavedExperience { id, savedAt, data: ExperienceItem }[]`, capped at 30, hardened
  like every other list loader (malformed entries dropped, fresh `id` on insert).
- resume.ts: `listExperienceLibrary` / `saveExperienceToLibrary` / `deleteLibraryExperience`.
- Builder Experience section:
  - per-entry ghost button "Save role to library" (Bookmark icon) beside Duplicate,
    disabled while the entry is empty; saves a deep copy.
  - next to "Add role", a "From library (n)" button (hidden when the library is empty)
    toggling an inline panel listing saved roles (role — company, saved date) with
    Insert and Delete actions. Insert appends a copy with a fresh id.

## Non-goals

- No schema change to `Resume` (the library lives outside the document).
- No AI calls, no scoring change, no hosted storage, no education/projects library.

## Verification

- lint / tsc / build green locally.
- Production QA: save → appears in panel → survives refresh → insert into a fresh
  resume copies all fields with a new id → delete works → cap and malformed-data
  hardening via localStorage injection → 375px touch targets → localStorage restored.
