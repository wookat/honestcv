# R219 QA plan — "Punctuated bullet points" check (index-RWpYJafD.js)

Code evidence: src/lib/ats.ts — punctuatedBulletsCheck(lines): offender = first trimmed non-empty line with (!/^[A-Z0-9]/ || !/[.!?]$/); pass iff no offender (zero lines → guard pass). Fail hint: `"<line, 60-char trunc…>" — start each bullet with a capital letter and end it with a period so your resume reads professionally.` Anchor experience. Builder feed = visible experience bullets + project/involvement descriptions + custom bullets (hidden excluded; empty projects/involvement/customSections for exact fixtures). Checker feed = textBulletLines. Denominators: checker 19, Builder 20; fix +5.3 = 100/19.

## N1 Bundles
index-RWpYJafD.js / ats-oFLTLlUA.js / AtsChecker-BtTSbvbb.js / Builder-D67rAP8o.js exact.

## N2 Builder matrix
(a) "shipped the api" → fails quoting the line (lowercase start). (b) "Shipped the API." → passes. (c) "Cut costs by 30%" → fails (no terminal punct). (d) "24/7 on-call rotation." → passes (digit start OK). (e) "Shipped it!" and "Improved onboarding?" endings pass. 20 breakdown rows; Fix → experience anchor top ~112.

## N3 Hidden excluded
Unpunctuated bullet on hidden entry ignored → pass.

## N4 Checker
(a) "- shipped the api" fails with quoted line; (b) fully punctuated fixture passes; (c) no-marker text guard passes even though prose/date headers lack terminal periods; 19 rows.

## N5 Arithmetic + priority fix
Score == round(passed/19·100) digit-exact; fix row +5.3 pts; Fix in builder → experience anchor.

## N6 Independence
Bullet "shipped the api without metrics" (no digit, unpunctuated) → both "Punctuated bullet points" AND R218 "Quantified bullet points" rows fail with their own evidence; R168 per-bullet underline guidance unchanged.

## N7 375 + dark
375px scrollWidth==375 (checker + builder breakdown); dark row contrast ≥4.5:1 (class=dark guard before capture).

## N8 Cleanup
Zero /api/ai/* generation calls; light theme; localStorage exactly ["honestcv.clientId","honestcv.qa"].

## Results (executed against production)
- N1 bundles exact: index-RWpYJafD.js / ats-oFLTLlUA.js / AtsChecker-BtTSbvbb.js / Builder-D67rAP8o.js — PASS
- N2a "shipped the api" → fails quoting the line; N2b "Shipped the API." → passes; N2c "Cut costs by 30%" → fails; N2d "24/7 on-call rotation." → passes (digit start); N2e "!"/"?" endings pass — ALL PASS
- N2 Builder breakdown 20 rows; Fix → experience anchor top 112.39 — PASS
- N3 hidden entry with unpunctuated bullet ignored — PASS
- N4a checker "- shipped the api" fails quoting the line; N4b punctuated fixture passes; N4c no-marker guard passes (prose/headers without periods don't trigger); 19 rows — PASS
- N5 arithmetic digit-exact: 89 = round(17/19·100), 95 = round(18/19·100); fix +5.3 pts = 100/19; Fix in builder → experience anchor 112.39 — PASS
- N6 independence: bullet "shipped the api without metrics" fails BOTH "Punctuated bullet points" (quotes line) and R218 "Quantified bullet points" ("Only 0 of 1 bullets carry a number") with separate evidence — PASS
- N7 375px scrollWidth 375 (both pages); dark contrast 14.75:1 ((228,232,239) on (18,22,29)), class=dark guarded — PASS
- N8 zero /api/ai/* calls; light theme; localStorage ["honestcv.clientId","honestcv.qa"] — DONE
- P3 finding: the built-in sample resume ("Load example") FAILS the new check out of the box — first offender "Led migration of the checkout flow to React + TypeScript, re…" (60-char truncation displayed correctly). Sample bullets lack terminal periods; every new user loading the example sees ✗ on this row.
