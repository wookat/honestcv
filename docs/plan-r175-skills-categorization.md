# R175 — One-click skills categorization + skills-format check

## First-hand Rezi evidence (2026-08-31, app.rezi.ai Finish Up → Explore my Rezi score)

- Rezi's score modal contains a dedicated Format audit:
  > **Your skills are formatted incorrectly** — Skills should be condensed into
  > categories such as hard skills, soft skills, etc.
- It fails whenever the skills section is a flat list, and feeds the Format
  sub-score (observed Format 41 on a flat-skills resume).

## RezUp today

- `skillLines()` already supports the `Category: a, b, c` line format; preview,
  PDF/DOCX/TXT/MD all render bold category labels (R135).
- The Builder shows only a *passive* tip when ≥8 skills are uncategorized
  ("put each category on its own line…") — no action, and no score/check
  reflects the formatting, so the tip is easy to ignore.

## Scope

1. `src/lib/resume.ts`: new deterministic `categorizeSkills(skills: string)`:
   - splits a flat (no labelled lines) comma/newline list into known buckets —
     Languages / Frameworks & libraries / Cloud & DevOps / Databases / Tools /
     Practices — via a ~180-term dictionary; unmatched terms go to `Other`.
   - returns `null` (no suggestion) when the list already has labels, has <8
     skills, or fewer than half the terms are recognized into named buckets
     (a mostly-`Other` grouping is worse than none).
   - preserves the user's original casing and order within each bucket.
2. `src/pages/Builder.tsx`: the existing tip gains a **Group into categories**
   button (applies the transformation via `set('skills', …)` — undoable with
   the existing history); tip text unchanged otherwise.
3. `src/lib/ats.ts`: new structure check in `scoreResume` (Builder path only):
   "Skills grouped into categories" — passes when the skills list is small
   (<8 skills) or contains labelled category lines; hint mirrors Rezi's wording.

## Non-goals

- No AI call (deterministic, local); no schema/storage/API change; no change
  to exports (label rendering already exists); no change to the paste-text
  ATS checker (`scoreResumeText` — raw text already gets the `skills:` regex).

## Acceptance

- Flat 10-skill list → check fails, tip shows button; click → skills textarea
  becomes labelled lines, preview shows bold categories, check passes, undo
  restores the flat list.
- <8 skills or already-categorized list → no button, check passes.
- Mostly-unknown skill list (e.g. niche domain terms) → no button (null).
- 1440px + 375px, no horizontal overflow; lint/typecheck/build green; deploy;
  smoke R172/R173/R174 markers before QA.
