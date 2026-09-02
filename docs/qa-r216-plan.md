# R216 QA plan — "Active voice in bullet points" check (index-CFmxwWWV.js)

Code evidence: src/lib/ats.ts — PASSIVE_RE `\b(was|were|is|are|been|being)\s+(?:\w+ly\s+)?([a-z]{2,}ed|<irregulars incl. [a-z]*built/written|led|won|run|set|put)\b` (i); activeVoiceCheck(lines): first passive line fails; hint `"<phrase>" is passive voice ("<line ≤60 chars…>") — lead with an active verb so employers see your specific contribution.`; anchor 'experience'. Builder feed: visible experience bullets + project/involvement descriptions + customSections bullets (summary excluded). Checker feed: textBulletLines (bullet-marker lines only, markers stripped); zero marker lines → guard pass. Denominators: checker 16, Builder 17.

## K1 Bundles
index-CFmxwWWV.js / ats-D1jNaBBT.js / AtsChecker-2rvPxpn7.js / Builder-Kd5YKTh2.js exact.

## K2 Builder fail→pass + 17 rows
Add bullet "Was responsible for the deployment pipeline and was rebuilt twice." → row fails, hint quotes "Was responsible" and truncated line (60+…); change to "Owned the deployment pipeline end to end." → passes. 17 rows.

## K3 Hidden ignored
Passive bullet on hidden entry → check passes.

## K4 Checker matrix (16 rows)
(a) "- The system was built by a small team" → fails quoting "was built". (b) Same line active ("- Built the system with a small team") → passes. (c) Passive prose with NO bullet markers → passes (guard). (d) 16 structure rows; no-JD score == round(passed/16·100).

## K5 Priority fix + deep link
Strong fixture (top-5 cap): "Active voice in bullet points … Fix in builder →" +6.3 = 100/16; click → /builder [data-section-anchor="experience"] top 112.

## K6 Regex forms
(a) "Reports were written weekly." fails ("were written"). (b) "Deployments were carefully reviewed by leads." fails (adverb). (c) Negatives "Built 3 services", "Led a team of 8" pass.

## K7 375 + dark
Failing checker row at 375 (scrollWidth==375); Builder breakdown at 375 no overflow; dark pixel contrast ≥4.5:1.

## K8 Regression
R214 numeric date fails; R215 junk-named PDF file-name row fails; R211 pronoun fails — smoke.

## K9 Cleanup
Zero AI generation calls (quota read OK); light theme; localStorage exactly ["honestcv.clientId","honestcv.qa"].

## Results (executed against production)
- K1 bundles exact: index-CFmxwWWV.js / ats-D1jNaBBT.js / AtsChecker-2rvPxpn7.js / Builder-Kd5YKTh2.js — PASS
- K2 Builder 17 rows; passive bullet fails quoting "was rebuilt" (NOT "Was responsible" as task stated — "responsible" is not a participle per PASSIVE_RE, so the first true match is "was rebuilt"; line truncated at 60 chars + …); active rewrite passes — PASS with disclosure
- K3 hidden entry with passive bullet ignored — PASS
- K4 checker: "- The system was built…" fails quoting "was built"; active passes; no-marker passive prose (incl. passive summary) passes guard; 16 rows; scores 81=round(13/16·100), 88=round(14/16·100) exact — PASS
- K5 priority fix "+6.3 pts" shown; Fix in builder → experience anchor top 112.39 — PASS
- K6 "Reports were written weekly." fails ("were written"); adverb "were carefully reviewed" fails; "Built 3 services; Led a team of 8." passes — PASS
- K7 375px scrollWidth 375 (checker + builder breakdown); dark contrast 14.75:1 ((228,232,239) on (18,22,29)) — PASS
- K8 regression: R214 numeric-date fails, R211 pronoun fails, R215 junk-name PDF file row fails (note: uploaded-file checks only render after clicking "Check my ATS score") — PASS
- K9 zero /api/ai/* (not even quota fired on sampled pages); light theme; localStorage ["honestcv.clientId","honestcv.qa"] — DONE
