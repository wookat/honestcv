# R96: word-count range check in ATS scoring

## Evidence (first-hand, 2026-08-29)

- Rezi score modal (`~/audit-r1/audit-r95/score-modal-text.txt`, logged-in audit of
  app.rezi.ai finish-up) lists **"Resume is too short"** and **"Word count is outside
  the recommended range"** among its Content/Best Practices findings.
- Same round (shots-r96): Rezi AI Cover Letter creation is Pro-gated ($29/mo upgrade
  modal on CREATE COVER LETTER) — our free generator already exceeds; no gap there.
- HonestCV today: builder `scoreResume()` (src/lib/ats.ts) has 7 structure checks and
  **no length/word-count check at all**; the paste-text path only has a crude
  400-character "Enough content to parse" gate.

## Scope

Add one structure check to both scoring paths in `src/lib/ats.ts`:

- Label: `Word count in recommended range`
- Pass: total resume word count within **400–800** words (common recruiter guidance
  for a 1–2 page resume; conservative wide band to avoid nagging).
- Hint is dynamic and states the current count and direction:
  - `< 400`: "Your resume is N words — recruiters and ATS systems expect at least ~400; expand your experience bullets."
  - `> 800`: "Your resume is N words — trim to under ~800 so recruiters can scan it."
- Builder path: `anchor: 'experience'` (both fixes happen in experience bullets),
  wired automatically into the existing R82/R83 Fix → deep links.
- Word count = `resumeToPlainText(resume)` (or raw pasted text) split on whitespace.

## Effects / non-goals

- Structure denominator changes 7→8 (builder) and 7→8 (text path) — scores shift
  slightly; this is an intentional new check, same as R62's dates check.
- `atsScoreSummary` picks it up automatically (assistant stays grounded).
- Out of scope: separate "too short"/"too long" as two checks, page-count-based
  length, per-section word budgets, score-weight (70/30) changes, AI calls.

## Verification

`npm run lint`, `npx tsc -b`, `npm run build`, `git diff --check`; deploy; production
QA: boundary counts (399/400/800/801), dynamic hint text both directions, Fix → jump,
score modal + assistant summary include the check, /ats-checker paste path, 375px,
console/network hygiene, zero AI calls, localStorage byte-restore, R95 regression.
