# R250 — High-priority vs remaining keywords in interview answer feedback

## Rezi first-party evidence

- rezi.ai/ai-interview ("Receive your detailed AI feedback report", step 3):
  > "In the keywords report, you'll see a breakdown with two different sections – 'High Priority Words' and 'Remaining Keywords' that highlight important words, skills to incorporate into your resume."
- Same page ("Data-driven AI interview feedback"):
  > "Rezi highlights missing keywords from the job description and suggests improvements to optimize your AI interview performance."

## Current state (verified in code)

- `analyzeAnswer` (src/lib/interviewAnalysis.ts) already scores JD keyword coverage per answer, but returns a flat `{ covered, missing }` — the practice analysis card renders a single "try working in: a, b, c, d, e" list with no priority signal.
- The prioritization heuristic already exists and is production-tested since R202: `highPriorityKeywords(jd, keywords)` in src/lib/ats.ts (multi-word phrases, ≥3 repeats, requirements-block hits, first-line/title hits). The keyword panel and ATS checker use it; interview practice does not.

## Design (additive, deterministic, zero AI)

1. `AnswerAnalysis['keywords']` gains `highPriorityMissing: string[]` — the subset of `missing` (order preserved) that `highPriorityKeywords(jobDescription, kws)` flags. `covered`/`missing` and the score math are untouched, so the practice score is bit-identical for every input.
2. Practice analysis card (Builder): when missing keywords exist, replace the flat list with up to two lines mirroring Rezi's two report sections:
   - `High priority: <up to 5 high-priority missing>` (amber emphasis)
   - `Also mentioned: <up to 5 remaining missing>` (muted, only if room/any)
   Coverage counter line unchanged; when nothing is high priority, the single line keeps the old "try working in:" phrasing over the remaining keywords.

## Non-goals / invariants

- No worker/schema/AI/quota changes; no new dependency.
- Practice score, STAR flags, delivery metrics (R233–R236) byte-identical.
- ATS keyword panel/checker tiers (R202) untouched.

## Validation matrix

- Fixture JD with a requirements block + repeated keyword + title phrase: assert `highPriorityMissing` equals the R202 panel's high-priority set intersected with missing.
- Answer covering all high-priority keywords → only "Also mentioned" line; covering everything → no missing lines; empty JD → no keyword row (unchanged).
- Practice score identical before/after for the fixture answers.
- 375px wrap, dark-mode contrast on the amber line, zero AI calls, R233–R236 delivery rows unchanged.
