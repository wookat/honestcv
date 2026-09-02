# R241 — structured job-description sections in the jobs detail pane

## Rezi first-party evidence

Job Search guide (rezi.ai/rezi-docs/job-search), step 3 "Review job details":

> "Instead of scanning one giant wall of text, Rezi organizes job descriptions into
> sections so you can quickly decide whether a role makes sense for you."
> Sections listed: About the Role, Responsibilities, Requirements, Skills, Location,
> Work Type, Experience Level, Education Level, Annual Salary, Benefits, About the
> Company, Equal Opportunity Information.

## Current state

- `/jobs` detail pane renders `selected.description` as one `whitespace-pre-wrap`
  paragraph — literally the "giant wall of text" Rezi calls out (Jobs.tsx ~line 861).
- The worker already flattens Remotive HTML to text preserving line structure
  (`htmlToText`: `</h1-6>`/`</p>`/`<li>` → newlines, bullets become `• `).

## Evidence from production data (2026-09-02)

Sampled `GET /api/jobs/search?q=engineer|designer` (18 jobs each): a two-rule
heuristic detects headings in 18/18 descriptions with no observed false positives:

1. line ends with `:`, ≤8 words, ≤60 chars, not a bullet, doesn't start with a digit
   ("Requirements:", "What we offer:", "How to apply:"), or
2. line has no terminal punctuation, ≤5 words, and starts with a section keyword
   (about/overview/responsibilit/duties/requirements/qualification/skills/experience/
   benefits/perks/compensation/salary/what/who/why/nice/preferred/bonus/how/your/our/
   the role/key/location/equal) — "About the Role", "Responsibilities", "Compensation".

Lines starting with digits ("3+ years of experience…") are excluded (real content,
not headings).

## Design (deterministic, zero AI)

- New pure `structureJobDescription(description): { heading: string | null; body: string }[]`
  in `src/lib/jobs.ts` implementing the two-rule heading heuristic. The text before
  the first heading becomes a `heading: null` preamble section. If no heading is
  detected, return one `heading: null` section (renders exactly like today).
- Jobs detail pane replaces the single `<p>` with the section list: headings render
  as small uppercase tracked headers (same style family as the R224 score-group
  headers), bodies keep `whitespace-pre-wrap`. Trailing `:`/spaces stripped from the
  displayed heading.
- Zero changes to worker, schema, pipeline, match scores, Target-my-resume (still
  copies the raw `job.description`), tracking, or scoring.

## Validation

- Fixture description with headings of both rule shapes → sections split correctly,
  preamble kept, bullets stay in bodies.
- Description with no heading-like lines → single block identical to today.
- Real production listings render with visible section headers.
- Target my resume still copies the full raw description into the draft JD.
- 375px + dark mode; ATS 99/100 regression; zero /api/ai calls.
