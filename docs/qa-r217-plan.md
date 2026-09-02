# R217 QA plan — "No empty buzzwords" check (index-DKQpTXPT.js)

Code evidence: src/lib/ats.ts — SCORED_BUZZWORDS = [synergy, go-getter, think outside the box, team player, hard worker, detail-oriented, results-driven, self-starter]; buzzwordCheck(segments) scans segments in order, within a segment the FIRST LIST match wins (`SCORED_BUZZWORDS.find(w => regex(w).test(seg.text))`), word-boundary case-insensitive. Builder segments: [{summary, anchor summary}, {joined visible exp bullets + project/involvement descriptions + custom bullets, anchor experience}]. Checker: textPronounSegments (pre-Experience → summary anchor, post → experience; no heading → summary). Fail hint: `"<phrase>" is an empty claim — replace it with a concrete, checkable fact (what you did, for whom, with what result).` Denominators: checker 17, Builder 18.

## L1 Bundles
index-DKQpTXPT.js / ats-D-xu0rJa.js / AtsChecker-D-nvv_Bh.js / Builder-9JJM5KvD.js exact.

## L2 Builder summary fail + deep link
Summary contains "Results-driven team player" → fails quoting "team player" (first list match, not "results-driven"); 18 rows; priority fix ≈+5.9 present in checker context; Builder row Fix → lands [data-section-anchor="summary"] top ~112.

## L3 Builder experience anchor
Clean summary, experience bullet "Known as a hard worker across teams" → fails quoting "hard worker", Fix → lands on experience anchor.

## L4 Hidden + clean
Buzzword only in hidden entry → passes. Removing phrases → passes.

## L5 Negatives
"dynamic programming" + "passionate about mentoring" in bullets → scored check passes.

## L6 Checker
(a) "self-starter" in summary paragraph → fails, anchor summary (Fix link → /builder summary anchor). (b) same phrase only under Experience heading → fails anchor experience. (c) clean text passes. (d) 17 rows; score == round(passed/17·100) digit-exact; fix +5.9 = 100/17.

## L7 Regression
Same fixture: R216 active voice fails on "- The system was built…", R211 pronoun fails on "I am", R214 numeric date fails on "08/2021" — all independent while buzzword check evaluated separately.

## L8 375 + dark + cleanup
375px scrollWidth==375 (checker + builder breakdown); dark row contrast ≥4.5:1; zero /api/ai/* generation calls (quota OK); light theme; localStorage exactly ["honestcv.clientId","honestcv.qa"].

## Results (executed against production)
- L1 bundles exact: index-DKQpTXPT.js / ats-D-xu0rJa.js / AtsChecker-D-nvv_Bh.js / Builder-9JJM5KvD.js — PASS
- L2 summary "Results-driven team player…" → fails quoting "team player" (first list match, exact hint); Builder 18 rows; Fix → summary anchor top 112.39 — PASS
- L3 buzzword only in experience bullet ("hard worker") → fails, Fix → experience anchor top 112.39 — PASS
- L4 hidden-entry-only buzzword → passes; clean → passes; 18 rows stable — PASS
- L5 negatives "dynamic programming" / "passionate about mentoring" → scored check passes — PASS
- L6a checker "self-starter" in summary → fails; priority fix +5.9 pts; Fix in builder → summary anchor 112.39; 17 rows; score 88 = round(15/17·100) — PASS
- L6b same phrase only under Experience → fails, Fix in builder → experience anchor 112.39 — PASS
- L6c clean → passes; score 94 = round(16/17·100) — PASS
- L7 regression combined fixture: R216 active voice ("was built"), R211 pronoun ("I"), R214 numeric date ("08/2021") all fail independently alongside buzzword "team player"; score 65 = round(11/17·100) — PASS
- L8 375px scrollWidth 375 (checker + builder breakdown); dark contrast 14.75:1 ((228,232,239) on (18,22,29)); zero /api/ai/* calls; light theme; localStorage ["honestcv.clientId","honestcv.qa"] — PASS/DONE
- Note: dark capture needed a retry — the theme toggle state machine (aria-label matching) inverted once; verified final capture pixel colors.
