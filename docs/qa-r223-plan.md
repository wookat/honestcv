# R223 QA plan — "Strong bullet openers" check (index-B65tqj9l.js)

Code evidence: src/lib/ats.ts — exported WEAK_OPENERS (responsible for / worked on / helped with / helped to / duties included / tasked with / in charge of / assisted with / participated in); weakOpenerCheck(lines): first bullet whose trimmed lowercase text startsWith a weak opener fails; hint `"<line, 60-char trunc…>" opens with "<opener>" — lead with a strong action verb (Led, Built, Cut…) so employers see your impact first.`; zero lines guard-pass; anchor experience. guidance.ts now imports WEAK_OPENERS from ats.ts (per-bullet wavy underline unchanged — regression check). Builder feed = visible experience/project/involvement/custom bullets; checker feed = textBulletLines. Denominators: checker 22, Builder 24; fixes +4.5 = 100/22 (checker chip) / Structure delta ≈ +4.2 = 100/24 (builder).

## S1 Bundles + rows
index-B65tqj9l.js / ats-C0Q1tSd2.js / AtsChecker-Dgpwl8bi.js / Builder-M-unthjf.js exact. Builder 24 rows; /ats-checker 22 rows.

## S2 Builder weak opener
Bullet "Responsible for maintaining the deploy pipeline." → ✗ with exact hint quoting line + `opens with "responsible for"`; in Priority fixes; Fix → experience anchor top ~112.

## S3 Mid-line + strong openers
"Led team responsible for billing." → ✓ (startsWith only). "Led a team of 8 engineers." → ✓. Fresh "Load example" → ✓ out of the box.

## S4 Checker
"- Worked on various tasks." → BOTH "Strong bullet openers" ✗ (quoting `"worked on"`) AND R222 "No filler words" ✗ (quoting "various") independently; prose/date headers not scanned (no-marker weak-opener prose → guard pass); clean paste → ✓. 22 rows; priority fix +4.5 pts chip; Fix in builder deep link → experience anchor.

## S5 Arithmetic
Checker score == round(passed/22·100) digit-exact; Builder Structure == round(passed/24·100).

## S6 Independence
Weak-opener bullet that is active voice, well-sized, punctuated → only the new row flips vs R216 passive / R220 length rows.

## S7 Guidance underline regression
In the Builder editor, a weak-opener bullet still shows the per-bullet wavy underline / guidance flag (import refactor unchanged).

## S8 375 + dark + cleanup
375px scrollWidth==375 both pages; dark class guard, row contrast ≥4.5:1; zero /api/ai/* generation calls (quota read allowed); light theme; localStorage exactly ["honestcv.clientId","honestcv.qa"].

## Results (executed against production)
- S1 bundles exact (index-B65tqj9l.js / ats-C0Q1tSd2.js / AtsChecker-Dgpwl8bi.js / Builder-M-unthjf.js — deploy confirmed live); Builder 24 rows, checker 22 rows — PASS
- S2 "Responsible for maintaining the deploy pipeline." → ✗ exact hint `"Responsible for maintaining the deploy pipeline." opens with "responsible for" — lead with a strong action verb (Led, Built, Cut…) so employers see your impact first.`; in Priority fixes; Fix → experience anchor 112.39; Structure 88 = round(21/24·100) with 3 fails — PASS
- S3 "Led team responsible for billing." mid-line → ✓; "Led a team of 8 engineers." → ✓ (Structure back to 92); fresh "Load example" → ✓ out of the box (92 = round(22/24·100), only pre-existing skills-grouping + word-count fails) — PASS
- S4 checker "- Worked on various tasks." → BOTH Strong bullet openers ✗ (quoting "worked on") AND R222 No filler words ✗ (quoting "various") independently; 22 rows; 86 = round(19/22·100); priority fix +4.5 pts = 100/22; Fix in builder → /builder experience anchor 112.39; no-marker weak-opener prose → guard ✓; clean paste ✓ with 91 = round(20/22·100) — PASS
- S5 arithmetic digit-exact per above (24/22 denominators) — PASS
- S6 independence: weak-opener bullet (active voice, punctuated, well-sized) flips only the new row; Active voice / Punctuated / Bullet length all ✓ — PASS
- S7 guidance regression: same bullet still shows wavy underline + per-bullet flag `⚠ Line 1: Starts with "responsible for" — open with a strong action verb instead (Led, Built, Cut…)` in the editor (WEAK_OPENERS import refactor intact) — PASS
- S8 375px scrollWidth 375 (builder + checker); dark contrast 14.75:1 ((228,232,239) on (18,22,29)) with class="dark" guard; only allowed /api/ai/quota read, zero generation calls; light theme; localStorage ["honestcv.clientId","honestcv.qa"] — PASS/DONE
