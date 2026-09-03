# R325 — exploratory production audit: interview prep chain

## Why this target

- The interview practice surface accumulated many rounds (R201 instant local
  analysis, R233 timed answers/pace, R234 quick-filler metrics, R235 filler
  sounds, R236 tone proxy, R250 keyword tiers in feedback, R256 keywords back
  to resume, R257 instant local questions, R258 session report, R298 job-title
  word filtering) but has not been deep-walked end-to-end since ~R298.
- Rezi keeps investing in AI Interview (public product page + changelog),
  so parity regressions here are core-functionality gaps, not copy.

## Scope (production, cv.zalize.com, zero real AI)

1. /interview-prep entry → question generation (instant local path with
   resume + target JD; verify R298 skill-word behavior still holds).
2. Practice flow: type an answer → instant local analysis (STAR, keywords
   with high-priority/remaining tiers, score), timed answer with pace /
   speaking time, quick fillers, filler sounds, tone proxy.
3. Session end → R258 session feedback report; R256 "add keywords to resume"
   bridge into the Builder.
4. Edge cases: empty answer, very short answer, no target JD, no resume.
5. Mobile 375 strict width through the whole flow; dark mode; baseline
   restore; all /api/ai/* intercepted before network.

## Output

Findings triaged P0–P3; any P0/P1 fixed same round; docs-only PR if clean.

## Fix (same round): coachable keyword tiers

Audit finding (informational→P3, adopted): the R298 skill-word filter applied
only to question generation; the per-answer keyword tiers and the session
report still coached toward title words ("senior, engineer") and generic JD
filler ("used, daily"). Fix in interviewAnalysis.ts only:

- New `GENERIC_JD_WORDS` stoplist + `coachableKeywords(kws)` (single-word
  keywords dropped if in JOB_TITLE_WORDS or GENERIC_JD_WORDS; multi-word
  phrases always kept).
- Applied to the keyword universe in `analyzeAnswer` and `sessionReport`
  (score denominator shrinks accordingly — intended, more honest coaching).
- ats.ts shared extractor untouched (resume/ATS scoring semantics unchanged,
  same boundary as R298). Company names can't be filtered generically and
  remain (arguably legitimate to mention).
- All-title/filler JD now degrades to no keyword panel (same as no-JD path).

Oracle .tmp-smoke/r325_oracle.ts.
