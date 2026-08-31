# R112 — Skills library: save a polished skills set once, reuse it across resume copies

## First-hand evidence (2026-08-29)

- Rezi resume editor, Skills tab (`~/audit-r1/shots-r112/skills.png|.txt`): every skills
  entry has a first-class **"SAVE TO SKILLS LIST"** action, completing the trio with
  "SAVE TO EXPERIENCE LIST" (R99) and "SAVE TO EDUCATION LIST" (R111).
- Our product now has per-entry libraries for experience (`honestcv.experienceLibrary`,
  R99) and education (`honestcv.educationLibrary`, R111), but the Skills section — a
  single multi-line text block that since R97 supports categorized lines like
  `Languages: Python, TypeScript` — has no way to reuse a polished skills set in another
  resume copy. Rebuilding a categorized skills block by hand is exactly the kind of
  repeated work the libraries exist to remove.

## Design

Mirror the R99/R111 pattern, adapted to skills being one text block rather than a list
of structured entries:

- `resume.ts`:
  - `interface SavedSkills { id: string; savedAt: number; skills: string }`
  - new localStorage key `honestcv.skillsLibrary`, max 30, newest first
  - `listSkillsLibrary()`, `saveSkillsToLibrary(skills)`, `deleteLibrarySkills(id)`
  - sanitization: non-string / blank `skills` rows and rows missing `id`/numeric
    `savedAt` are silently dropped; malformed JSON and storage failures are ignored
- `Builder.tsx` Skills section:
  - a BookmarkPlus "Save skills to library" button next to the AI buttons (disabled
    when the textarea is blank; green check flash on save, same 1.6 s pattern)
  - "From library (n)" toggle, hidden when the library is empty
  - each saved row shows the first line truncated + saved date, with Insert / Delete
  - **Insert semantics**: skills is a single field, so Insert *appends* the saved
    block's lines to the current skills text (joined with a newline); when the current
    field is blank it simply becomes the saved block. No replacement, no data loss.

Non-goals: no schema/AI/scoring/export changes; no dedup of individual skill tokens on
insert (user keeps control); no cross-device sync.
