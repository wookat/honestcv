# R298 — SOP-10 four-dimension audit + fix: instant interview questions template raw JD title words

## SOP-10 audit (2026-09-02, production cv.zalize.com, zero AI quota)
Full walkthrough evidence in docs/qa-r298-plan.md (screenshots /home/ubuntu/screenshots/r298_*.png).

- D1 操作台: fresh-user chain completes with no hard break; export has a 3-modal stack
  (email gate → final check → share) — subjective, candidate for a later round.
- D2 功能深度: one confirmed P3 (below). LinkedIn import DOES exist (PDF export import
  path, R266 dashboard hint + looksLikeLinkedInExport mapping) — the audit probe looked
  for a dedicated "LinkedIn" button; discoverability, not absence. Subjective, deferred.
- D3 落地页: no social proof — deliberate: HonestCV has no real testimonial/user-count
  data and fabricating them contradicts the product's honesty positioning. Deferred
  until real numbers exist.
- D4 架构: Career documents / Sample library are anchor routes; Builder is the single
  super-surface. Works for the local-first model; no change this round.

## Confirmed P3 (this round's fix)
Repro (production, r298_3_interview_instant_q.png): Builder → Interview prep → Instant
questions with a SWE JD produced "This role emphasizes software. Describe a specific
project where you used it…" and "…emphasizes engineer…".

Root cause: `localInterviewQuestions` (src/lib/interviewAnalysis.ts) takes the first two
`highPriorityKeywords` verbatim. For most JDs the highest-frequency high-priority tokens
are the job-title words themselves (software / engineer / manager…), which read as
nonsense in the "used it" question frame. `extractKeywords`/`highPriorityKeywords` are
shared with ATS scoring and must not change.

## Fix (interviewAnalysis.ts only)
1. Filter candidate keywords before picking two:
   - drop tokens of `resume.targetRole` and of the JD's first line only when they are
     generic title words (a small JOB_TITLE_WORDS stoplist: software, engineer,
     engineering, developer, manager, senior, junior, lead, staff, principal, analyst,
     specialist, associate, consultant, intern, architect, sr, jr, level, remote,
     full-time, part-time, contract);
   - keep multi-word phrases and non-title tokens (react, kubernetes, sql…).
   - fall back to non-high-priority keywords (same filter) if fewer than two survive.
2. Phrase the keyword by name instead of "it": "Describe a specific project where you
   used <kw> and what the outcome was." — reads correctly for every keyword.

## Non-goals
- No changes to ats.ts extractKeywords/highPriorityKeywords (shared with scoring,
  keyword targeting, assistant).
- No AI fallback; the feature stays local and instant.
- The interview-prep template's bracketed [role]/[Company] placeholders are the
  template's intentional fill-in convention — unchanged.

## Verification
- Oracle .tmp-smoke/r298_oracle.ts: SWE JD no longer yields title-word questions and
  picks real skills; JD with only title words falls back gracefully; no-JD path
  unchanged; question count/order preserved.
- tsc/lint/build, deploy, production QA via testing agent.
