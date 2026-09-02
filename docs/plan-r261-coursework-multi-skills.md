# R261 — Coursework entries list up to three skills (Rezi parity)

## First-party Rezi evidence

Rezi Docs "Coursework" (rezi.ai/rezi-docs/the-resume-coursework-section-best-practices,
published 2026-07-30):

> "Add your coursework details by including the course name, institution,
> completion date, **up to three relevant skills**, and a brief explanation of
> how you applied those skills."

## Gap in HonestCV

`CourseworkItem.skill` is a single free-text field ("Skill used (optional,
e.g. Teamwork)"), rendered as one `Skill: X` bullet by `courseworkBullets`.
A user who practiced several skills in one course (the common case Rezi
designs for) can only record one, or crams a comma list into a bullet that
still reads `Skill: A, B, C`.

## Design (zero schema change)

Keep `skill: string` — interpret it as a comma-separated list, capped at 3:

- New pure helper in `src/lib/resume.ts`:
  `courseworkSkills(c): string[]` — split `c.skill` on commas, trim, drop
  empties, keep the first 3.
- `courseworkBullets`:
  - 1 skill → `Skill: X` (byte-identical to today for all existing data
    without commas).
  - 2–3 skills → `Skills: A · B · C`.
  - >3 entered → only the first 3 render.
- Builder coursework editor: placeholder becomes
  `Skills used (optional, up to 3 — e.g. Teamwork, SQL)`; when more than 3
  comma-separated values are entered, a muted hint appears:
  `Only the first 3 skills appear on the resume.`

All render paths (preview, PDF, DOCX, TXT/plain text, Markdown) funnel
through `courseworkBullets`, so they inherit the behavior with no further
edits.

## Non-goals

No schema/persistence change, no AI/worker/scoring changes, no changes to the
coursework library, no new localStorage keys.

## Verification

- Oracle: single skill byte-identical; 2 and 3 skills → `Skills: A · B`
  separator `·`; 5 entered → 3 rendered; whitespace/empty-segment trimming;
  description bullets unchanged and ordered after the skills bullet.
- Production QA: editor hint appears only at >3; preview/exports show the
  joined line; existing single-skill resumes unchanged; 375px; dark mode
  contrast; zero AI calls.
