# R226 — "Application ready" readiness verdict (Rezi Application Ready parity)

## First-party evidence (fetched 2026-09-02, https://www.rezi.ai/rezi-docs/the-rezi-score-explained)
- Rezi's five scoring areas include "Application Ready: Is your resume ready to submit?"
- "The Application Ready category looks at how well everything comes together across the rest
  of your score. It helps answer one important question: Is this resume ready to send? At this
  stage, Rezi checks for missing details, inconsistencies, and whether your resume meets a
  solid overall standard. The stronger your performance across the other four categories, the
  better your Application Ready score will be."
- Score tiers (same doc): "90+ → Your resume is in strong shape, and you're ready to apply.
  50–89 → You have a solid foundation, but a few improvements could make a difference.
  Below 50 → It's worth making some updates before sending applications."

## Current HonestCV gap
R224 grouped structure checks into Content/Format/Best practices and treated keyword score as
the Optimization analogue, but deliberately skipped Application Ready ("no local equivalent").
There is no roll-up answering "is this resume ready to send?" — users must interpret raw
numbers themselves.

## Design (presentation-only, derived — no new scoring)
- New pure helper `applicationReadiness(result: AtsResult)` in `src/lib/ats.ts` returning
  `{ tier: 'ready' | 'almost' | 'not-yet'; blockers: string[] }`:
  - tier from the overall ATS `score` using Rezi's published thresholds: ≥90 ready,
    50–89 almost, <50 not-yet.
  - blockers = up to 3 plain-language reasons pulled from existing data only: failing
    categories phrased as "N Content/Format/Best-practices checks failing", plus
    "keyword match below N%" when keywordScore !== null && < 70 (the existing 70/30 blend
    weight boundary is NOT reused as a claim — phrasing sticks to the number itself).
- Builder Score breakdown: an "Application ready" strip above the category groups — emerald
  "Ready to send" (score ≥90), amber "Almost there" (50–89), red "Needs work" (<50), with the
  blockers line underneath. Pure derivation from the already-rendered `ats` result.
- /ats-checker: same strip on the result card above "Format & content checks".
- Zero changes to scores, checks, categories, priority fixes, deep links, chips (R225), or
  persistence.

## Acceptance
1. Fresh sample (score 97 with JD absent → structureScore 92? verify live): strip reflects the
   real overall score tier; blockers list matches failing rows.
2. Weak-opener checker fixture (86) → "Almost there" with correct blockers; fixed paste (95)
   → "Ready to send".
3. A gutted resume (<50) → "Needs work".
4. Score arithmetic and all R224/R225 baselines byte-identical.
5. 375px no overflow; dark mode ≥4.5:1 (use non-inverted-safe tokens per R225 lesson).
