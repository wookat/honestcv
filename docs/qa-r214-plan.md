# R214 QA plan — "Dates use a written month" check (index-5f-j64b6.js)

Code evidence: src/lib/ats.ts — namedMonthDatesCheck(dates): first trimmed date with dateStyle=='numeric' fails; hint `"<offender>" is numeric — write dates with a month name ("<Abbr YYYY>") so employers grasp your timeline at a glance.`; pass hint 'Dates use written month names — employers grasp your timeline at a glance.'; anchor 'experience'. namedMonthSuggestion: "08/2021"→"Aug 2021" (also ./- separators). Builder feed: [...experience, ...education].filter(!hidden).flatMap(start/end). Checker feed: textDateRanges halves (Experience block only); no heading/ranges → []. Denominators: checker 15, Builder 16.

## I1 Bundles
index-5f-j64b6.js / ats-CfTo5YZ9.js / AtsChecker-BWwDp0dB.js / Builder-BmKG8ogm.js exact.

## I2 Builder sample
16 rows; "✓Dates use a written month" (bare years 2017/2021 skipped, not failed).

## I3 Builder fail + both date checks + deep link
experience[0].startDate='08/2021' → new row fails with hint quoting "08/2021" and suggesting "Aug 2021"; R210 "Consistent date formatting" ALSO fails (mix) with its own hint; new check in Priority fixes; Fix → lands [data-section-anchor="experience"] top 112.

## I4 Hidden + bare-year edge
(a) offender entry hidden=true → new check passes. (b) all dates bare years → both date checks pass.

## I5 Checker matrix (15 rows) + arithmetic
(a) named-month fixture passes. (b) "08/2021 - 03/2023" → fails quoting "08/2021"→"Aug 2021". (c) bare-year range passes. (d) no Experience heading → pass guard. (e) 15 rows; no-JD score == round(passed/15·100); fix +6.7 = 100/15.

## I6 Dot/dash forms
"08.2021" and "08-2021" fail with suggestion "Aug 2021".

## I7 375 + dark
Failing row at 375 (scrollWidth==375); dark pixel contrast ≥4.5:1.

## I8 Regression
R213 locations fail on comma-free-header location-less entry; R210 consistency; R203 pts sorted desc.

## I9 Cleanup
Zero AI generation calls (quota read OK); light theme; localStorage exactly ["honestcv.clientId","honestcv.qa"].

## Results (production)
- I1 bundles exact: index-5f-j64b6.js / ats-CfTo5YZ9.js / AtsChecker-BWwDp0dB.js / Builder-BmKG8ogm.js — PASS
- I2 Builder sample: 16 rows; "✓Dates use a written month"; education bare years "2017"/"2021" present and skipped — PASS
- I3 startDate='08/2021': fails with exact hint quoting "08/2021" → suggestion "Aug 2021"; R210 row also fails independently ("Jul 2021" vs "08/2021"); row Fix → experience anchor top 112 — PASS
- I4a offender hidden → passes; I4b all bare years → both date checks pass — PASS
- I5a named-month fixture passes; I5b "08/2021 - 03/2023" fails quoting offender; I5c bare-year range passes; I5d no-heading guard passes — PASS
- I5e checker 15 rows; no-JD 60/100 = round(9/15·100); fixes +6.7 = 100/15 — PASS (digit-exact)
- I5f priority fix: crowded out of top-5 on the weak 6-failure fixture (known top-5 cap); surfaced on a strong fixture ("Fix in builder →" → /builder, experience anchor top 112) — PASS with cap disclosure
- I6 "08.2021" and "08-2021" both fail with suggestion "Aug 2021" — PASS
- I7 375px scrollWidth 375; dark label pixel contrast 14.75:1 — PASS
- I8 regression: R213 locations fails on location-less comma-free-header entry (quoting its date range); R210 mix fails; R203 pts [20,12,6.7,6.7,6.7] sorted desc — PASS
- I9 zero AI generation calls (only page-load /api/ai/quota, accepted); light theme; localStorage exactly ["honestcv.clientId","honestcv.qa"] — DONE
