# R339 — exploratory production audit: jobs pipeline + design tools chain (SOP-02)

## Rationale (first-hand coverage map)
- Rezi changelog re-checked in R338 (2026-09-03): latest public entry is still
  August 2026 Week 4 — no new first-party surface to chase this round, so the
  round goes to depth on chains least recently deep-walked.
- Last deep walks: share chain R337, print R334–R336, AI writing R327, import
  R332, interview R325, inline editing R322–R323, org/history R338(D1).
  The /jobs pipeline management chain (tracked queue, timeline, notes, bulk
  actions, follow-up email, stale nudges, targeted copies → builder bridge)
  has not been deep-walked end-to-end since ~R328, and the design tools
  (template compare R237, photo crop R232, saved/recent template filters
  R132) not since their landing rounds.

## Audit plan (production, zero AI quota, mock /api/ai/* before any request)
1. Jobs pipeline: search → save → track → status transitions incl. Offer
   (R247) → timeline entries + notes persistence (R190) → stale nudge +
   ?attention=1 (R253–R254) → follow-up email draft (R255, mocked) → bulk
   actions (R249) → untrack confirm (R191) → targeted resume copy (R183) and
   its builder bridge with tailoring progress (R188/R252).
2. Design tools: template picker saved/recent filters, compare-two-templates
   dialog, recommendations (R264); photo upload + crop/reposition dialog and
   its persistence into preview/exports; combined with dark mode + 375px.
3. URL-state regressions on /jobs (R312) while doing 1.
4. Baseline restore, revoke nothing (no shares this round unless needed).

Deliverable: findings ranked P0–P3; fix the highest confirmed small finding
in the same round; otherwise log candidates to handoff.
