# R110: per-job match score + "Best match" sort on /jobs

## First-hand evidence (Rezi, 2026-08)

- `app.rezi.ai/dashboard/job-search` (audit shots-r110/job-search-results.png):
  a real search ("Software Engineer" / "New York") returns a results list with
  a **MATCHED** pipeline tab and a **BEST MATCH** sort — Rezi ranks jobs by
  how well they match your resume, not just recency.
- Our /jobs (R17/R19/R20/R46): status tabs Saved/Applied/Interviewing/Rejected
  and Relevance/Newest sort exist, but nothing relates a job to *your resume*.
  Users must open each posting and eyeball it; the ATS keyword engine we
  already ship (`extractKeywords` + matched-ratio in `src/lib/ats.ts`) is only
  used after a job is targeted.

## Gap

Rezi: the list itself tells you which jobs fit your resume best. Us: every
job looks the same until you target it.

## Design

Client-only, zero AI/network:

- `src/lib/ats.ts`: export `matchScore(resumeText, jd): number | null` —
  `extractKeywords(jd)` and the same word/phrase hit test used by
  `scoreResumeText`, returning the matched-keyword percentage (null when the
  JD yields no keywords). Pure reuse of the existing tokenizer/keyword logic
  so the number agrees with the ATS keyword score after targeting.
- `src/pages/Jobs.tsx`: memoize `resumeToPlainText(loadResume())` once and a
  per-job score map over the loaded listings (30 keywords × ~40 jobs — cheap).
  Show a `XX% match` badge on each row and in the detail pane, and add a
  **Best match** option to the existing sort select (desc by score, ties by
  recency). No resume in storage → no badges, sort hidden.

## Non-goals

- No Rezi MATCHED pipeline tab (our statuses are user-set; auto-populating a
  tab from a threshold invents a workflow Rezi drives server-side).
- No new storage keys, no schema/AI/scoring-engine changes, /ats-checker and
  builder ATS panel untouched.
