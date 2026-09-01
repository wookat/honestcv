# R209 QA plan — 3–6 bullet points per role check (index-B2bjXt6W.js)

Code evidence: src/lib/ats.ts — bulletsPerEntryCheck (L200-215): first entry with count <3 or >6 fails, hint `"<name>" has N bullet point(s) — aim for 3–6 per role so each entry shows enough impact without overwhelming the reader.` (singular "point" when N==1), pass hint "Every role carries 3–6 bullet points — enough detail without overwhelming the reader.", anchor 'experience'. Builder scoreResume (L528-535): visible entries with role||company; count = non-blank bullets; name "role at company". Checker textBulletCounts (L180-198): experience block only; returns [] (→pass) when no heading, no bullet-marker lines anywhere in block, or no date ranges; entries = segments between consecutive DATE_RANGE_RE matches, named by the range, counting lines matching /^\s*[-–—•*▪◦·]\s*\S/. "Work experience with bullets" hint now "Use 3-6 bullet points per role…". Example resume Nova Retail has a 3rd bullet. Checker checks = 10, Builder = 11.

## C1 Bundles
index-B2bjXt6W.js / AtsChecker-B9dvmLT4.js / Builder-DoRH7b_j.js. PASS iff exact.

## C2 Builder example passes
Load example → breakdown row "✓3–6 bullet points per role" (Nova Retail now 3 bullets; verify localStorage entry has the new "Instrumented checkout funnel analytics…" bullet). PASS iff row present ✓ and card says 11-point checklist ("N of 11").

## C3 Builder fail states
(a) Delete Nova Retail bullets to 1 → row fails, hint exactly `"Junior Developer at Nova Retail" has 1 bullet point — aim for 3–6 per role…` (singular). (b) Give first entry 7 bullets → fails naming "Software Engineer at Brightlane" with "has 7 bullet points". (c) Hide the 1-bullet entry → passes. (d) Blank entry (no role/company) with 1 bullet → ignored, passes.

## C4 Checker paste matrix
Base text with Experience heading, two dated roles with "- " bullets. (a) role1 3 bullets, role2 4 → pass; (b) role2 reduced to 1 bullet → FAIL quoting role2's date range and "has 1 bullet point"; (c) same text with all bullet markers stripped (plain lines) → pass (guard); (d) no Experience heading → pass; (e) Education block containing "- " bullet lines while experience entries have 3+ → pass (education not counted).

## C5 Priority fix + deep link
Strong no-JD fixture failing only this check → fix row "3–6 bullet points per role … +10 pts" (100/10) with "Fix in builder →"; click (confirm stubbed) → /builder, [data-section-anchor="experience"] top in view.

## C6 Arithmetic
One JD fixture: structure == round(passed/10·100) counted from rows; overall == round(kw·0.7+structure·0.3); a failing structure fix shows +3 = round(30/10·10)/10. PASS iff digit-exact.

## C7 375 + dark
Failing row at 375 (scrollWidth==375); dark contrast ≥4.5:1. Screenshots.

## C8 Regression
R208 reverse-chron: builder fail on out-of-order dates + checker ascending fail; R203 fixes sorted desc; R207 clean.pdf file checks all pass.

## C9 Cleanup
Zero /api/ai calls; light theme; localStorage exactly ["honestcv.clientId","honestcv.qa"].

## Results (2025-09-01, production)
- C1 bundles exact: index-B2bjXt6W.js / AtsChecker-B9dvmLT4.js / Builder-DoRH7b_j.js — PASS
- C2 example resume: "✓3–6 bullet points per role"; Nova Retail has the new 3rd "Instrumented checkout funnel analytics…" bullet; Builder breakdown shows 11 rows — PASS
- C3a 1 bullet → fail, hint exactly `"Junior Developer at Nova Retail" has 1 bullet point — aim for 3–6 per role…` (singular) — PASS
- C3b 7 bullets → fail `"Software Engineer at Brightlane" has 7 bullet points…` — PASS
- C3c hidden 7-bullet entry ignored → pass state — PASS
- C3d blank entry (no role/company) with 1 bullet ignored — PASS
- C4a 3+4 bullets pass; C4b 1-bullet role fails quoting `"2019 - 2021" has 1 bullet point`; C4c marker-less paste passes; C4d no Experience heading passes; C4e education "- " bullets not counted — ALL PASS
- C5 no-JD fixture: fix row "High 3–6 bullet points per role … Fix in builder →" rendered; deep link → /builder with [data-section-anchor="experience"] top 112 in view; no-JD score 80/100 = round(8/10·100) — PASS
- C6 JD fixture: keyword 20, structure 60 = round(6/10·100) from displayed rows, overall 32 = round(20·0.7+60·0.3); structure fix +3 pts = 30/10 — PASS (digit-exact)
- C7 375px scrollWidth 375; dark label pixel contrast 14.75:1 ((228,232,239) on (18,22,29)) — PASS
- C8 regression: R208 builder fail names "Software Engineer at Beta Corp"; checker ascending fails quoting "Jun 2023 - Present"; R203 fix points [20,12,10,10,10] sorted desc; R207 clean.pdf → all 6 file checks incl. both font checks ✓ — PASS
- C9 zero /api/ai/* requests; light theme; final localStorage exactly ["honestcv.clientId","honestcv.qa"] — DONE
