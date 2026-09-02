# R212 QA plan — LinkedIn URL check (index-C7D-_-AR.js)

Code evidence: src/lib/ats.ts — linkedinCheck(pass): label 'LinkedIn URL', fail hint 'Add your LinkedIn URL (linkedin.com/in/yourname) — recruiters use it to verify and expand on your resume.', pass hint 'LinkedIn URL found — recruiters can verify and expand on your resume.', anchor 'contact'. Builder: pass iff resume.contact.linkedin.trim() non-empty AND !(resume.hiddenContact ?? []).includes('linkedin'). Checker: /linkedin\.com\//i.test(raw text). Denominators: checker 13, Builder 14. hiddenContact toggle in Builder.tsx L2038-2069 (R143 show-on-resume).

## F1 Bundles
index-C7D-_-AR.js / AtsChecker-D7RbvLYk.js / Builder-mhJhJxNQ.js / ats-OYhRufgY.js exact.

## F2 Builder pass + 14 rows
Example resume (linkedin.com/in/jordanreyes) → "✓LinkedIn URL"; breakdown has 14 rows.

## F3 Builder fail states
(a) contact.linkedin='' → fails with exact hint. (b) Restore value, hiddenContact=['linkedin'] → fails too (data present but hidden). (c) Un-hide → passes.

## F4 Deep link to Contact
Checker fixture without linkedin: fix row "LinkedIn URL … Fix in builder →"; click (confirm stubbed) → /builder with [data-section-anchor="contact"] in view.

## F5 Checker matrix (13 rows)
(a) Text with "linkedin.com/in/jane" → pass. (b) Same text with "in/jane" only (no linkedin.com/) → FAIL. (c) "LINKEDIN.COM/in/jane" uppercase → pass (case-insensitive). (d) Checker rows count == 13.

## F6 Arithmetic
No-JD checker: score == round(passes/13·100) from displayed rows; failing fix +100/13 ≈ +7.7. Builder rows == 14.

## F7 375 + dark
Failing row at 375 (scrollWidth==375); dark pixel contrast ≥4.5:1.

## F8 Regression (smoke)
R211 pronoun fail ("I am…"), R210 date-mix fail, R203 pts sorted desc — combined fixture.

## F9 Cleanup
Zero /api/ai calls; light theme; localStorage exactly ["honestcv.clientId","honestcv.qa"].

## Results (2025-09-01, production)
- F1 bundles exact: index-C7D-_-AR.js / AtsChecker-D7RbvLYk.js / Builder-mhJhJxNQ.js / ats-OYhRufgY.js — PASS
- F2 example resume (linkedin.com/in/jordanreyes): "✓LinkedIn URL"; Builder breakdown 14 rows — PASS
- F3a contact.linkedin='' → fail with exact hint 'Add your LinkedIn URL (linkedin.com/in/yourname) — recruiters use it to verify and expand on your resume.' — PASS
- F3b value restored but hiddenContact=['linkedin'] → still fails (hidden contact field counts as missing) — PASS
- F3c un-hidden → passes again — PASS
- F4 fix row "LinkedIn URL … Fix in builder →" rendered; deep link → /builder with [data-section-anchor="contact"] top 112 in view — PASS
- F5a "linkedin.com/in/jane" → pass; F5b "in/jane" alone → FAIL; F5c "LINKEDIN.COM/in/jane" → pass (case-insensitive); F5d checker shows 13 rows — ALL PASS
- F6 arithmetic: no-JD 77/100 = round(10/13·100) from displayed rows; failing fixes +7.7 = 100/13; Builder 14 rows — PASS (digit-exact)
- F7 375px scrollWidth 375; dark label pixel contrast 14.75:1 ((228,232,239) on (18,22,29)) — PASS
- F8 regression (combined fixture with linkedin present): R211 pronoun fails (Found "I"), R210 date-mix fails ("Jun 2023" vs "08/2017") while LinkedIn URL passes independently; R203 pts [20,12,7.7,7.7,7.7] sorted desc — PASS
- F9 zero /api/ai/* requests; light theme; final localStorage exactly ["honestcv.clientId","honestcv.qa"] — DONE
