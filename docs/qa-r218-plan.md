# R218 QA plan — "Quantified bullet points" check (index-WAF1G-X5.js)

Code evidence: src/lib/ats.ts — quantifiedBulletsCheck(lines): quantified = lines with /\d/; needed = max(1, ceil(total/3)); pass iff total==0 || quantified>=needed. Fail hint: `Only <q> of <t> bullets <carries|carry> a number — quantify at least a third (scope, scale, %, time or money) so achievements are concrete.` ("carries" iff q==1). Anchor experience. Builder feed = visible experience bullets + project/involvement descriptions + custom bullets (hidden excluded). Checker feed = textBulletLines (marker lines only; digits in headers/dates never count). Denominators: checker 18, Builder 19; fix +5.6 = 100/18.

## M1 Bundles
index-WAF1G-X5.js / ats-D-2Hilp4.js / AtsChecker-BCJmQ8JT.js / Builder-BePg7Fni.js exact.

## M2 Builder ratio math
(a) Exactly 3 visible unquantified bullets → fails "Only 0 of 3 bullets carry a number". (b) Add a digit to one → passes (1 ≥ ceil(3/3)=1). (c) 9 bullets, 2 numbered → fails "Only 2 of 9 bullets carry a number" (needs 3). Deep link Fix → experience anchor top ~112. 19 breakdown rows.

## M3 Hidden excluded
Hidden entry holding unquantified bullets removed from total → pass state flips accordingly.

## M4 Checker
(a) Bullets without digits → fails with exact ratio (singular "carries" case if q=1). (b) Quantified → passes. (c) NO bullet markers + zero digits → guard pass. (d) Digits only in date header ("Jun 2021 - Present") with unquantified bullets → still fails (header digits don't count). 18 rows.

## M5 Arithmetic + priority fix
Score == round(passed/18·100) digit-exact; fix row ≈ +5.6 pts; Fix in builder → experience anchor.

## M6 Regression
Same fixture: R217 buzzword ("team player"), R216 active voice ("was built"), R211 pronoun independent. Builder: R169 per-entry key-number chip and R203 "Quantified impact" writing dimension still present/unchanged.

## M7 375 + dark
375px scrollWidth==375 (checker + builder breakdown); dark row contrast ≥4.5:1 (guard class=dark before capture).

## M8 Cleanup
Zero /api/ai/* generation calls; light theme; localStorage exactly ["honestcv.clientId","honestcv.qa"].

## Results (executed against production)
- M1 bundles exact: index-WAF1G-X5.js / ats-D-2Hilp4.js / AtsChecker-BCJmQ8JT.js / Builder-BePg7Fni.js — PASS
- M2a 3 unquantified bullets → fails "Only 0 of 3 bullets carry a number" (exact hint) — PASS
- M2b one digit added → passes (1 ≥ ceil(3/3)) — PASS
- M2c 9 bullets / 2 numbered → fails "Only 2 of 9 bullets carry a number" (needs 3) — PASS
- M2 deep link Fix → experience anchor top 112.39; Builder breakdown 19 rows — PASS
- M3 hidden entry with 6 unquantified bullets ignored (visible 1/3 passes); unhidden → fails "Only 1 of 9 bullets carries a number" (singular "carries" verified) — PASS
- M4a checker unquantified bullets fail exact ratio; M4d date-header digits ("Jun 2021 - Present", phone, years) never counted — same fixture proves it — PASS
- M4b quantified → passes; M4c no-marker guard passes; 18 checker rows — PASS
- M5 arithmetic digit-exact: 83 = round(15/18·100), 94 = round(17/18·100), 67 = round(12/18·100); fix +5.6 pts = 100/18; Fix in builder → experience anchor 112.39 — PASS
- M6 regression: R217 buzzword ("team player"), R216 active voice ("was built"), R211 pronoun all fail independently on same fixture; R169 per-entry key-number chip ("⚠ Key numbers in 0 of 6 bullets…") and R203 "Quantified impact" writing dimension (on /ats-checker) both present/unchanged — PASS
- M7 375px scrollWidth 375 (both); dark contrast 14.75:1 ((228,232,239) on (18,22,29)), class=dark guarded before capture — PASS
- M8 zero /api/ai/* calls; light theme; localStorage ["honestcv.clientId","honestcv.qa"] — DONE
