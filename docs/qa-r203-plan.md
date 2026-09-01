# R203 QA plan — Priority fixes + writing-quality row on /ats-checker (index-B7L92a9S.js)

Code evidence: src/pages/AtsChecker.tsx (analysis useMemo gated on `result` [itself gated on `checked`]; "Priority fixes" block after sub-scores `<details>`, before keyword tier grid; fixes list red `bg-red-100 text-red-700` "High" / amber "Med" chips + `+N pts`; emerald empty state "No priority fixes — every check passes and all writing dimensions score 80+."; 6-dimension row colored red<50/amber<80/emerald≥80); src/lib/guidance.ts L407-449 priorityFixes (structureWeight = 30 with JD else 100; perCheck = weight/#checks, impact high iff perCheck≥10; keyword fix points = round(70·missing/total), high iff ≥10 or kwScore<50; health fixes points = round((100−score)·weight), high iff ≥10 or score<50; sorted desc by points, top 5), HEALTH_WEIGHTS {completeness .3, quantification .2, verbs .2, brevity .1, buzzwords .1, consistency .1}.

## V1 Bundles
Entry index-B7L92a9S.js; /ats-checker chunk AtsChecker-CCKje6Cr.js. PASS iff exact.

## V2 Example flow
Click "See an example score first". Assert: "Priority fixes" block renders between the sub-score `<details>` and "Missing keywords (n)"; ≤5 items, points strictly non-increasing top→bottom; each chip High (red bg-red-100/text-red-700 computed) iff points≥10 (or the score<50 clauses), else Med amber; keyword fix text mentions "Add missing job keywords — m of t posting keywords are absent" with m/t matching the R202 tier counts (7 missing for example fixture per R202); its points = round(70·m/t). Dimension row shows exactly 6 labeled scores with correct color banding. ATS score value identical to R202 QA fixture (100/100 was builder example; ats-checker example fixture previously scored — assert score = keyword×0.7+structure×0.3 arithmetic from displayed sub-scores). Screenshot.

## V3 Weak resume
Paste a resume with no numbers, "Responsible for..." openers, buzzwords ("synergy, go-getter, team player"), keep example JD, click Check. Assert: fixes include writing dimensions (Quantified impact and/or verb dimension) with red/amber dimension values (<50 red, 50–79 amber) in the row; at least one High chip. Screenshot.

## V4 Strong case / empty state
Resume = full example resume, JD = word-boundary-safe slice of the resume (nothing missing, R202 recipe). If all checks pass and all dims ≥80 → emerald empty-state text exact match; else fixes list shrinks vs V3 and contains no keyword fix ("Add missing job keywords" absent). Screenshot.

## V5 No-JD case
Example resume, JD empty, Check. Assert: block still renders; no "Add missing job keywords" item; failing structure checks now weighted at 100/#checks (points per check > the with-JD value, chips High); completeness/JD-related text reads sensibly (not "undefined"/NaN). Screenshot.

## V6 Recompute gate
After a result is shown, edit the resume textarea → results card (incl. Priority fixes) disappears; re-click Check → reappears. (R202 known behavior; broken gate would keep stale fixes visible.)

## V7 Regression
R202 tiers (High priority/Remaining groups render with example JD); JD inline highlight segments; "Format & content checks" list present; "Fix it in the builder" button present; R189 file checks: upload a .docx/.pdf → file check chips render (reuse prior artifact resume file if available; else generate a quick DOCX via builder export? — use a text-only skip if no file at hand and disclose).

## V8 Dark + widths
Dark mode via UI: High chip = red-100 bg remapped? chip uses bg-red-100/text-red-700 with NO dark: overrides — in dark palette -100 remaps dark, -700 remaps light → verify pixel contrast ≥4.5:1 and note any issue; dimension values use dark:-400 tokens (safe). 1440 and 375: document scrollWidth == innerWidth. Screenshots (incl. dark zoom).

## V9 Cleanup
Zero non-quota /api/ai calls; light theme; localStorage exactly ["honestcv.clientId","honestcv.qa"].

## Results (executed against production, all via CDP on the QA Chrome profile)
- V1 PASS: entry index-B7L92a9S.js; chunk AtsChecker-CCKje6Cr.js.
- V2 PASS: example flow — Priority fixes block renders between sub-score details and keyword grid (compareDocumentPosition confirmed); items sorted desc [27, 3.8, 3.8]; keyword fix "7 of 18 posting keywords are absent" +27 pts = round(70·7/18) ✓ High (red-100/red-700 computed); structure checks 3.8 = 30/8 ✓ Med (amber); 6-dim row all 100 emerald-700; overall 65 = round(61·0.7 + 75·0.3) from displayed sub-scores 61/75 — formula unchanged.
- V3 PASS: weak resume ("Responsible for…", synergy/go-getter, no numbers) → fixes: keywords +62 High, Quantified impact +20 High, Action verbs +20 High, Buzzword-free +10 High, Skills check +3.8 Med; dims Quantified impact 0 and Action verbs 0 rendered red (oklch 0.505 0.213 27.5), Completeness 80 emerald.
- V4 PASS: strong 245-word resume + matched JD → fixes shrank to 1 Med (word count), all dims 100; extending to 400+ words → exact emerald empty state "No priority fixes — every check passes and all writing dimensions score 80+." (emerald-600 oklch 0.596 0.145 163) with score 100/100 and "Nothing missing".
- V5 PASS: no JD → block renders, no keyword fix, structure checks 12.5 pts = 100/8 (High) vs 3.8 with JD; dims sane (Completeness 95, no NaN/undefined).
- V6 PASS: editing resume textarea hides the whole results card incl. Priority fixes; re-clicking Check restores it. (Note: a <30-char resume disables the Check button by design — "Paste your resume text to enable the check".)
- V7 PASS (regression): R202 tiers High priority (7) + hint text; JD inline highlight (17 <mark>); "Format & content checks" list; "Fix it in the builder" button; R189 uploaded-file checks render for r203_resume.docx (size/tables/text boxes/images/headers) after re-clicking Check (upload resets checked=false).
- V8 PASS: dark chips — High chip text oklch(0.82 0.14 24) on bg oklch(0.33 0.07 25) (both remapped light-on-dark by the inverted palette), pixel contrast 7.29:1; dim values use dark:-400 tokens (safe). 1440: scrollWidth 1425 ≤ 1440; 375: scrollWidth 375, block renders.
- V9 DONE: zero non-quota /api/ai calls; light theme restored; localStorage exactly ["honestcv.clientId","honestcv.qa"].
