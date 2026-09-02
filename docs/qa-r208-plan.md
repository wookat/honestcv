# R208 QA plan — reverse-chronological experience check (index-DLpnjucm.js)

Code evidence: src/lib/ats.ts — reverseChronCheck (new L109-150): key = ONGOING_RE end → MAX_SAFE_INT else dateSortValue(end) ?? dateSortValue(start) (year*12+month, month unknown→6); undated skipped; fail on first cur.primary>prev.primary or equal-primary with cur.start>prev.start; fail hint `"<name>" appears below a less recent role — list your most recent position first (the Sort-by-date toggle fixes this in one click).`; pass hint "Most recent role first — …"; anchor 'experience'. textDateRanges (L152-172): only between /^(work|professional|employment )?experience:?$/im heading and next standard section heading; ranges via DATE_RANGE_RE (–—- or "to"). scoreResume maps visible (!hidden) experience entries, name "role at company" or 'Untitled role'. finalize: structure = round(passed/total·100); checker now has 9 checks (was 8) so R203 baselines shift (fix points = 30/9 ≈ +3.3).

## B1 Bundles
Entry index-DLpnjucm.js; /ats-checker chunk AtsChecker-BW5hQyL1.js; /builder Builder-C9Qr1Kz_.js. PASS iff exact.

## B2 Builder pass state (1440)
Load example resume → Score breakdown: row "Experience in reverse-chronological order" present with pass icon (emerald svg). PASS iff present+pass.

## B3 Builder fail + fix + deep link
Edit the FIRST experience entry's dates to older than the second (e.g. end "2015") → check fails; hint names the second entry `"<role> at <company>"` (the one now below a less recent role). Verify it appears in the Builder score panel and — separately — paste equivalent out-of-order text on /ats-checker: fail row + a priority fix "+3.3 pts" with "Fix in builder →" that jumps to `[data-section-anchor="experience"]` in view (confirm stubbed). PASS iff all.

## B4 Builder edge cases
(a) ongoing entry on top (example default: Present first) passes — covered by B2; (b) delete all but one dated entry → passes (<2 dated); (c) set an entry's dates to unparseable ("Springtime"/"???") while out of order → skipped, check passes; (d) hide the out-of-order entry (hidden toggle) → check passes again. PASS iff each state matches.

## B5 Checker text-path matrix (paste + Check)
(a) Experience heading + "Jun 2023 – Present" above "2019–2021" → pass; (b) swap (ascending: "08/2019 - 06/2021" above "Jun 2023 - Present") → FAIL, hint quotes the offending range string; (c) same ranges but NO Experience heading → pass (check listed, pass state); (d) "Experience" block in order + "Education" heading followed by ascending year ranges → pass (education ranges ignored). PASS iff exact states.

## B6 Score arithmetic
On one checker run with JD: overall == round(kw·0.7 + structure·0.3) where structure == round(passed/9·100) counted from displayed check rows; a reverse-chron priority fix shows +30/9 = +3.3 pts. PASS iff digit-exact.

## B7 375 + dark
Failing check row at 375 (scrollWidth==375) and dark mode; label/hint legible (pixel contrast ≥4.5:1 for label). Screenshots.

## B8 Regression (quick)
R203 priority-fixes block still renders with sorted points; R204 deep link from a non-R208 fix (keyword → target) still jumps; R207 uploaded file checks (clean.pdf → both font checks pass) intact.

## B9 Cleanup
Zero /api/ai calls; light theme; localStorage exactly ["honestcv.clientId","honestcv.qa"].

## Results (2025-09-01, production, index-DLpnjucm.js)
- B1 PASS — index-DLpnjucm.js / AtsChecker-BW5hQyL1.js / Builder-C9Qr1Kz_.js exact.
- B2 PASS — example resume: Builder Score breakdown row "✓Experience in reverse-chronological order" (Builder card is now a "10-point structure checklist", 8 of 10 passing on the example).
- B3 PASS — first entry end set to "2015": row fails with hint `"Junior Developer at Nova Retail" appears below a less recent role — list your most recent position first (the Sort-by-date toggle fixes this in one click).` Checker fix row "Fix in builder →" jumps to [data-section-anchor="experience"] top 112.
- B4 PASS — undated ("Springtime"/"???") entry skipped → pass (<2 dated); hiding the offending entry → pass; ongoing-on-top covered by B2.
- B5 PASS — checker paste: descending pass; ascending fails quoting `"Jun 2023 - Present"`; no Experience heading → pass; ascending Education year ranges ignored → pass.
- B6 PASS — kw 40 / structure 67 = round(6/9·100) → overall 48 = round(40·0.7+67·0.3); failing structure fix +3.3 = 30/9; no-JD fixture +11.1 = 100/9 High. Note: priorityFixes caps at top-5 by points, so on fixtures with bigger fixes the reverse-chron row can be crowded out (by design, guidance.ts L407 limit=5).
- B7 PASS — 375 scrollWidth 375; dark label contrast 14.75:1 (bg 18,22,29).
- B8 PASS (regression) — R203 fixes sorted desc [70,20,20,15,5]; R204 keyword fix → target anchor top 112; R207 clean.pdf → all 6 file checks incl. both font checks pass.
- B9 PASS — zero /api/ai calls; light theme; localStorage exactly ["honestcv.clientId","honestcv.qa"].
