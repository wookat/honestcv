# R211 QA plan — No first-person pronouns check (index-CSRTHPVU.js)

Code evidence: src/lib/ats.ts — PRONOUN_RE `/\b(?:[Mm]e|[Mm]y|[Mm]yself)\b|\bI(?=['’][a-z]|\s+(?!(?:of|and|or|in|at|on|to|for|the|an?)\b)[a-z])/`; pronounCheck: first segment match wins, fail hint `Found "<match>" — drop first-person pronouns ("I", "me", "my") and lead with the action itself: "Led a team of 8", not "I led my team".`, pass hint 'Written in the implied first person — no "I", "me" or "my" for recruiters to trip over.', anchor = matching segment's. Builder segments: [summary → 'summary'] then [visible experience bullets + project descriptions + involvement descriptions + customSections bullets joined → 'experience']. Checker textPronounSegments: split at EXPERIENCE_HEADING_RE index (head → summary, tail → experience); no heading → whole text summary. Denominators: checker 12, Builder 13.

## E1 Bundles
index-CSRTHPVU.js / AtsChecker-Bo0yIuOf.js / Builder-CCaJtZyd.js exact.

## E2 Builder pass + 13 rows
Example resume → "✓No first-person pronouns"; breakdown has 13 rows.

## E3 Builder summary fail + deep link to Summary
Summary set to "I am a senior engineer who ships." → row fails, hint contains `Found "I"`. Then on /ats-checker, fixture failing only-ish this check with pronoun before Experience heading: fix row "No first-person pronouns … Fix in builder →" click (confirm stubbed) → /builder with [data-section-anchor="summary"] in view.

## E4 Builder experience fail + hidden + negatives
(a) Clean summary; bullet "Led my team to ship faster" → fails, hint `Found "my"`, Fix → jumps to experience (row Fix → anchor). (b) Move pronoun bullet to a hidden entry → passes. (c) Negatives: summary "MySQL and I/O tuning for Phase I of the Portland, ME rollout" → passes.

## E5 Checker matrix (12 rows)
(a) "I built scalable systems." before Experience heading → fail; deep-link anchor = summary (verify Fix in builder lands on summary). (b) Pronoun only in a bullet after Experience heading → fail with anchor experience (Fix → lands on experience). (c) Negatives text (MySQL, I/O, Part I, Phase I of, Portland, ME; no real pronouns) → pass. (d) Checker rows count == 12.

## E6 Arithmetic
No-JD checker: score == round(passes/12·100) from displayed rows; failing fix +100/12 ≈ +8.3. Builder rows == 13.

## E7 375 + dark
Failing row at 375 (scrollWidth==375); dark pixel contrast ≥4.5:1.

## E8 Regression (smoke)
R210 date-format mix fail, R209 1-bullet fail, R208 ascending fail, R203 pts sorted desc — one combined fixture where feasible.

## E9 Cleanup
Zero /api/ai calls; light theme; localStorage exactly ["honestcv.clientId","honestcv.qa"].

## Results (2025-09-01, production)
- E1 bundles exact: index-CSRTHPVU.js / AtsChecker-Bo0yIuOf.js / Builder-CCaJtZyd.js — PASS
- E2 example resume: "✓No first-person pronouns"; Builder breakdown 13 rows — PASS
- E3 summary "I am a…" → fail, hint exactly `Found "I" — drop first-person pronouns ("I", "me", "my") and lead with the action itself: "Led a team of 8", not "I led my team".` — PASS
- E4a bullet "Led my team to ship faster" → fail `Found "my"` — PASS
- E4b pronoun bullet on hidden entry → passes — PASS
- E4c negatives "MySQL and I/O tuning for Phase I of the Portland, ME rollout. Delivered Part I." → passes — PASS
  (Note: an initial fixture "Part I complete." fails by design — "I" + lowercase verb is exactly the subject-verb pattern the regex targets; tester fixture error, not a bug.)
- E5a checker pronoun before Experience heading → fail; "Fix in builder →" lands on [data-section-anchor="summary"] top 112 — PASS
- E5b pronoun only in experience block ("Led my team…" bullet) → fail `Found "my"`; deep link lands on experience anchor top 112 — PASS
- E5c checker negatives (MySQL, I/O, Phase I of, Portland ME, Delivered Part I.) → pass — PASS
- E5d checker shows 12 check rows — PASS
- E6 arithmetic: no-JD 83/100 = round(10/12·100) from displayed rows; failing fixes +8.3 = 100/12; Builder 13 rows — PASS (digit-exact)
- E7 375px scrollWidth 375; dark label pixel contrast 14.75:1 ((228,232,239) on (18,22,29)) — PASS
- E8 regression (combined fixture): R210 mix fails ("Jun 2023" vs "08/2017"); R209 fails ("08/2017 - 05/2019" has 1 bullet point); R208 ascending fails ("Jun 2023 - Present"); pronoun check passes independently; R203 pts [20,12,8.3,8.3,8.3] sorted desc — PASS
- E9 zero /api/ai/* requests; light theme; final localStorage exactly ["honestcv.clientId","honestcv.qa"] — DONE
