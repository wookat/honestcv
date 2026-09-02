# R220 QA plan — "Bullet points the right length" check (index-Bh_sdk2x.js)

Code evidence: src/lib/ats.ts — bulletLengthCheck(lines): trimmed non-empty lines; offender = first with word count <4 or >30 (words = split /\s+/). Too short hint: `"<quote>" is only N word(s) — describe what you did and the result (aim for 8–25 words).` Too long: `"<quote>" runs N words — tighten it to under 25 words so it scans in a single glance.` 60-char quote truncation; zero lines guard pass; anchor experience. Feeds identical to R218/R219 (visible experience bullets + project/involvement descriptions + custom bullets; checker = textBulletLines). Denominators: checker 20, Builder 21; fix +5 = 100/20.

## O1 Bundles
index-Bh_sdk2x.js / ats-BV0gw7Wo.js / AtsChecker-BaxUGW_W.js / Builder-Df_KrGcL.js exact.

## O2 Builder matrix (controlled feed: projects/involvement/customSections emptied)
(a) "Fixed bugs." (2 words) → fails `"Fixed bugs." is only 2 words — describe what you did and the result (aim for 8–25 words).` (b) 31-word bullet → fails `…runs 31 words — tighten it to under 25 words…` with 60-char quote truncation. (c) 4-word and 30-word boundary bullets → pass. (d) Well-sized bullets pass. 21 breakdown rows; Fix → experience anchor top ~112.

## O3 Hidden excluded
Hidden entry with a 2-word bullet ignored → pass.

## O4 Checker
(a) "- Fixed bugs." marker fragment → fails quoting line + word count. (b) No-marker short prose lines → guard pass. (c) R219 punctuation + R218 quantified rows unaffected/independent on same fixture. 20 rows.

## O5 Arithmetic + priority fix
Score == round(passed/20·100) digit-exact; fix row +5 pts = 100/20; Fix in builder → experience anchor.

## O6 Sample resume
Fresh "Load example" → "Bullet points the right length" passes (bullets 10–17 words; project/involvement descriptions also in feed). If fails → P3.

## O7 375 + dark
375px scrollWidth==375 (checker + builder breakdown); dark row contrast ≥4.5:1 with class="dark" guard.

## O8 Cleanup + regression
R219 punctuated + R218 quantified quick regression; zero /api/ai/* generation calls; light theme; localStorage exactly ["honestcv.clientId","honestcv.qa"].

## Results (executed against production)
- O1 bundles exact: index-Bh_sdk2x.js / ats-BV0gw7Wo.js / AtsChecker-BaxUGW_W.js / Builder-Df_KrGcL.js — PASS
- O2a "Fixed bugs." → fails `"Fixed bugs." is only 2 words — describe what you did and the result (aim for 8–25 words).` — PASS
- O2b 31+ word bullet → fails `"Collaborated extensively with multiple cross functional stak…" runs 31 words — tighten it to under 25 words so it scans in a single glance.` (60-char truncation + exact count; second fixture at 32 words also reported exactly) — PASS
- O2c boundaries: 4-word bullet passes; exactly-30-word bullet passes (verified word count via split) — PASS
- O2 Builder breakdown 21 rows; Fix → experience anchor top 112.39 — PASS
- O3 hidden entry with 2-word bullet ignored — PASS
- O4a checker "- Fixed bugs." fails with same hint; R218 quantified + R219 punctuated rows PASS on same fixture (unaffected); 20 rows — PASS
- O4b well-sized bullets pass; O4c no-marker short prose guard passes — PASS
- O5 arithmetic digit-exact: 90 = round(18/20·100); regression fixture 85 = round(17/20·100); fix +5 pts = 100/20; Fix in builder → experience anchor 112.39 — PASS
- O6 fresh "Load example" sample passes the new row (incl. project/involvement descriptions in feed) — PASS
- O7 375px scrollWidth 375 (both pages); dark contrast 14.75:1 ((228,232,239) on (18,22,29)), class=dark guarded — PASS
- O8 regression: R219 punctuated ("shipped the api without metrics") and R220 length ("Fixed bugs.") fail independently while R218 quantified passes on same fixture; zero /api/ai/* calls; light theme; localStorage ["honestcv.clientId","honestcv.qa"] — PASS/DONE
