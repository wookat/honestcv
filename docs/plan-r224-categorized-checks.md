# R224 — Rezi-style category grouping for structure checks (Content / Format / Best practices)

## First-party evidence (Rezi public surface)

- Rezi Score user doc (https://www.rezi.ai/rezi-docs/the-rezi-score-explained):
  "Rezi calculates your score based on five key areas: Content … Format … Optimization …
  Best Practices … Application Ready", and "Rezi separates your feedback into five scoring
  areas: Content, Format, Optimization, Best Practices, and Application Ready. These
  categories are there to help you understand exactly where your resume stands."
- The doc itemizes the categories: **Content** — bullet points (3–6 per entry), achievements
  (measurable outcomes), context (enough detail), personal pronouns; **Format** — resume
  length, ≥3 bullet points per entry, section order/date formatting; **Best Practices** —
  Locations, Email address, Date format (written month), Resume name, Word count, LinkedIn
  URL, Skills format.
- Resume checker FAQ (https://www.rezi.ai/resume-checker): "Rezi resume checker analyses
  your resume across five core categories: Content, Format, Optimization, Best Practices,
  and Application Readiness."

## Gap in HonestCV

- Builder Score breakdown renders all 24 structure checks as one flat list; /ats-checker
  renders its 22 checks as one flat "Format & content checks" list. At 22–24 rows the flat
  list no longer communicates *where* a resume is weak (writing quality vs. layout vs.
  conventions), which is exactly what Rezi's category split solves.
- Optimization is already a separate surfaced sub-score (keyword match), and Application
  Ready has no local equivalent (no submission pipeline), so the structure checks map to
  the remaining three categories.

## Design (deterministic, presentation-only)

- `ats.ts`: add `export type CheckCategory = 'content' | 'format' | 'bestPractices'` and a
  required `category` field on `AtsResult['checks'][number]`. Export
  `CHECK_CATEGORIES: { key: CheckCategory; label: string }[]` in display order
  (Content, Format, Best practices).
- Category assignment follows Rezi's own documented itemization:
  - **content**: Professional summary present, Work experience with bullets, Enough content
    to parse, Quantified achievements, 3–6 bullet points per role, Quantified bullet points,
    Punctuated bullet points, Bullet points the right length, Active voice, Strong bullet
    openers, No empty buzzwords, No filler words, No first-person pronouns.
  - **format**: Standard section headings, Education listed, Employment dates found/listed,
    Experience in reverse-chronological order, Consistent date formatting, Fits the
    recommended page count.
  - **bestPractices** (mirrors Rezi Best Practices 7): Contact info complete / Email address
    found / Phone number found, LinkedIn URL, Locations on each entry, Dates use a written
    month, Word count in recommended range, Skills section filled/present, Skills grouped
    into categories.
- UI: Builder Score breakdown and /ats-checker "Format & content checks" group rows under
  category headers showing per-category pass counts (e.g. "Content · 11/13"). Row rendering,
  hints, Fix → deep links, and order within a category are unchanged.
- **Zero scoring change**: categories partition the existing check set; `structureScore`,
  priority fixes, `+pts` chips, and all denominators stay byte-identical. Every check keeps
  exactly one category (partition invariant: Σ category counts = total rows).

## Acceptance

1. Builder shows 3 category headers whose counts sum to 24; checker's sum to 22.
2. Same fixture scores identical before/after (structure %, ATS score, +pts values).
3. A weak-opener failure appears under Content; a mixed-date failure under Format; a
   missing-LinkedIn failure under Best practices.
4. Fix → deep links still jump; priority fixes unchanged.
5. 375px no overflow, dark-mode contrast preserved; zero AI calls.
