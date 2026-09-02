# R210 QA plan — Consistent date formatting check (index-CUTD_zCZ.js)

Code evidence: src/lib/ats.ts — MONTH_YEAR_RE `/^[a-z]{3,9}\.?[ ,./-]*(?:19|20)\d{2}$/i`, NUMERIC_DATE_RE `/^\d{1,2}[/.-](?:19|20)\d{2}$/`; dateStyle skips blank/ongoing/bare-year/unparseable. dateFormatCheck: fails only when both styles present; fail hint `Dates mix formats ("<first month-year>" vs "<first numeric>") — pick one style so ATS parsers read your timeline consistently.`; pass hint "Dates use one format — ATS parsers read your timeline consistently."; anchor 'experience'. Builder scoreResume: dates from [...experience, ...education].filter(!hidden) start/end. Checker scoreResumeText: dateFormatCheck(textDateRanges(raw).flatMap(r=>[r.start,r.end])) — experience block only. Denominators: checker 11 checks, Builder 12.

## D1 Bundles
index-CUTD_zCZ.js / AtsChecker-C2YSou0A.js / Builder-BcPktqrG.js exact.

## D2 Builder
(a) Example resume → row "✓Consistent date formatting"; Builder breakdown has 12 rows. (b) Set experience[1].startDate="08/2019" → FAIL, hint exactly `Dates mix formats ("Jun 2023" vs "08/2019") — pick one style…` (first month-year in [...experience,...education] scan order is experience[0].startDate "Jun 2023"). (c) Hide that entry → passes again. (d) Restore entry, set education[0].endDate="05/2019" (visible) → FAIL (Builder education in scope).

## D3 Checker paste matrix
(a) Experience block "Jun 2020 - Present" + "08/2017 - 05/2019" → FAIL quoting ("Jun 2020" vs "08/2017"). (b) All "Mon YYYY" ranges → pass. (c) "2019 - 2021" bare-year + "Jun 2023 - Present" → pass (bare years skipped). (d) Numeric dates only under Education heading (experience all Mon YYYY) → pass (checker ignores education).

## D4 Priority fix + deep link
Failing fixture: fix row "Consistent date formatting … Fix in builder →"; click (confirm stubbed) → /builder with [data-section-anchor="experience"] in view.

## D5 Arithmetic
Checker no-JD: score == round(passed/11·100) from displayed rows; a failing structure fix == +100/11 ≈ +9.1 no-JD or 30/11 ≈ +2.7 with JD. Builder rows count == 12.

## D6 375 + dark
Failing row at 375 (scrollWidth==375); dark contrast ≥4.5:1 by pixel.

## D7 Regression (smoke)
R209 3–6 bullets (1-bullet role fails both paths), R208 reverse-chron ascending fail, R203 fixes sorted desc.

## D8 Cleanup
Zero /api/ai calls; light theme; localStorage exactly ["honestcv.clientId","honestcv.qa"].

## Results (2025-09-01, production)
- D1 bundles exact: index-CUTD_zCZ.js / AtsChecker-C2YSou0A.js / Builder-BcPktqrG.js — PASS
- D2a example resume: "✓Consistent date formatting"; Builder breakdown shows 12 rows — PASS
- D2b experience[1].startDate="08/2019" → fail, hint exactly `Dates mix formats ("Jun 2023" vs "08/2019") — pick one style so ATS parsers read your timeline consistently.` — PASS
- D2c that entry hidden → passes again — PASS
- D2d visible education endDate="05/2019" → fails quoting ("Jun 2023" vs "05/2019") — Builder education in scope — PASS
- D3a checker mix "Jun 2020 - Present" + "08/2017 - 05/2019" → fail quoting ("Jun 2020" vs "08/2017") — PASS
- D3b all Mon YYYY → pass; D3c bare-year range "2019 - 2021" skipped → pass; D3d Education-section numeric "08/2012 - 05/2016" ignored (experience Mon YYYY) → pass — ALL PASS
- D4 fix row "Med · Consistent date formatting … Fix in builder →" rendered; deep link → /builder, [data-section-anchor="experience"] top 112 in view — PASS
- D5 arithmetic: no-JD 82/100 = round(9/11·100) from 11 displayed checker rows (2 fail); fixes +9.1 = 100/11; Builder 12 rows — PASS (digit-exact)
- D6 375px scrollWidth 375; dark label pixel contrast 14.75:1 ((228,232,239) on (18,22,29)) — PASS
- D7 regression: R209 1-bullet role fails quoting "Aug 2019 - Jun 2021"; R208 ascending order fails quoting "Jun 2023 - Present"; R203 fix points [20,12,9.1,9.1,9.1] sorted desc — PASS
- D8 zero /api/ai/* requests; light theme restored; final localStorage exactly ["honestcv.clientId","honestcv.qa"] — DONE
