# R222 QA plan — "No filler words" check (index-C0J0m4YK.js)

Code evidence: src/lib/ats.ts — SCORED_FILLERS in list order just/very/really/various/several/stuff/things/etc; all /i except stuff & things (lowercase only, so "Internet of Things" safe). fillerWordCheck(segments) mirrors buzzwordCheck: first list-order hit in first matching segment wins; fail hint `"<word>" is a filler word — cut it and state the concrete fact directly ("Cut load time 40%", not "really improved various things").`; anchor = hit segment. Builder segments: summary (anchor summary) then visible experience bullets + project/involvement descriptions + custom bullets joined (anchor experience). Checker: textPronounSegments. Denominators: checker 21, Builder 23; fixes ≈ +4.8 (100/21) checker / Structure delta ≈ +4.3 (100/23) builder.

## Q1 Bundles + rows
index-C0J0m4YK.js / ats-BNAgwigo.js / AtsChecker-pVQ816-K.js / Builder-D6iTTppJ.js exact. Builder 23 structure rows; /ats-checker 21 rows.

## Q2 Builder experience hit + list order
Bullet "Really improved various things over time." (clean summary) → row ✗ quoting "really" (list order: really before various/things); appears in Priority fixes; Fix → experience anchor top ~112.

## Q3 Summary anchor
Summary "Engineer who just ships products." (clean bullets) → ✗ quoting "just", Fix → summary anchor top ~112.

## Q4 Negative guards
Fixture with "justify", "justified", "everything", "Adjusted", "Internet of Things" → row ✓. Change to lowercase "handled things daily." → ✗ quoting "things".

## Q5 Checker
Paste with "- Led team and very quickly shipped 3 services." → ✗ quoting "very"; clean paste → ✓; 21 rows; score digit-exact round(passed/21·100); priority fix +4.8 pts; Fix in builder → deep link.

## Q6 Sample
Fresh "Load example" → row ✓ out of the box.

## Q7 Independence
Filler-only fixture (no buzzwords) → R217 "No empty buzzwords" ✓ while filler ✗; R221 page-count row unchanged (1-page → ✓).

## Q8 Arithmetic
Builder Structure == round(passed/23·100) digit-exact (e.g. 96 = round(22/23·100) with 1 fail); checker score == round(passed/21·100).

## Q9 375 + dark + cleanup
375px scrollWidth==375 both pages; dark class guard, row contrast ≥4.5:1; zero /api/ai/* generation calls (quota read allowed); light theme; localStorage exactly ["honestcv.clientId","honestcv.qa"].

## Results (executed against production)
- Q1 bundles exact (index-C0J0m4YK.js / ats-BNAgwigo.js / AtsChecker-pVQ816-K.js / Builder-D6iTTppJ.js); Builder 23 rows, checker 21 rows — PASS
- Q2 "Really improved various things over time." → ✗ quoting "really" (list order beats various/things) with exact hint; in Priority fixes; Fix → experience anchor 112.39; Structure 87 = round(20/23·100) with 3 fails — PASS
- Q3 summary "Engineer who just ships products." → ✗ quoting "just"; Fix → summary anchor 112.39 — PASS
- Q4 negatives justify/justified/everything/Adjusted/"Internet of Things" → ✓; lowercase "handled things daily." → ✗ quoting "things" — PASS
- Q5 checker "very quickly shipped" bullet → ✗ quoting "very"; 21 rows; 86 = round(18/21·100); priority fix +4.8 pts = 100/21; Fix in builder → /builder experience anchor 112.39; clean paste ✓ with 90 = round(19/21·100) — PASS
- Q6 fresh "Load example" → ✓ out of the box (Structure 91 = round(21/23·100), only pre-existing skills-grouping + word-count fails) — PASS
- Q7 independence: on filler-failing fixture (no buzzwords), R217 "No empty buzzwords" ✓ and R221 "Fits the recommended page count" ✓ in both builder and checker — PASS
- Q8 arithmetic digit-exact: Builder Structure 87/91 vs round(passed/23·100); checker 86/90 vs round(passed/21·100) — PASS
- Q9 375px scrollWidth 375 (builder + checker); dark contrast 14.75:1 ((228,232,239) on (18,22,29)) with class="dark" guard; only allowed /api/ai/quota read, zero generation calls; light theme; localStorage ["honestcv.clientId","honestcv.qa"] — PASS/DONE
