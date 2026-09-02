# R221 QA plan — "Fits the recommended page count" Builder-only check (index-D8jLSuP7.js)

Code evidence: src/lib/ats.ts pageLengthCheck(pages, level): allowed = 2 iff experienceLevel==='executive' else 1; pages==null||<1 → guard-pass with neutral hint "Page count is measured from the live PDF preview in the builder."; pass hint `N page(s) — within the X-page length recruiters expect[ at executive level].`; fail hint `Your resume runs N pages — recruiters expect X (two only at director/executive level); use Auto-fit or trim older roles and long bullets.` Anchor experience. Builder.tsx:1137 scoreResume(shown, jd, pdfLength?.pages ?? null), memo deps [shown, pdfLength]; usePdfLength debounced ~800ms (Builder.tsx:295, meter at :5555 "Resume length: X page(s)"). Checker unchanged (20 rows); Builder 21→22; fix +4.5 ≈ 100/22. experienceLevel select id="experienceLevel" (Builder.tsx:1959). Dashboard mini scores call scoreResume with 2 args → guard path (Dashboard.tsx:546/564/727).

## P1 Bundles + row counts
index-D8jLSuP7.js / ats-Dk3QfXSH.js / AtsChecker-BSxCnpa4.js / Builder-CHaCmi8f.js exact. Builder breakdown 22 rows; /ats-checker 20 rows and NO "Fits the recommended page count" row.

## P2 Sample 1-page pass
Fresh "Load example" → row ✓ with exact hint "1 page — within the 1-page length recruiters expect." (no executive suffix). Sample passes out of the box.

## P3 2-page fail (entry/mid level)
Grow content (add second experience entry with many 8–25-word quantified punctuated bullets so R218/R219/R220 stay green) until length meter shows pages=2. After debounce: row ✗ with exact hint `Your resume runs 2 pages — recruiters expect 1 (two only at director/executive level); use Auto-fit or trim older roles and long bullets.` Appears in Priority fixes with +4.5 pts; Fix → experience anchor top ~112. Verify Builder-side score consistency: with F fails of 22, displayed score == round((22-F+...)/…) — assert digit-exact vs passed-row count (e.g. 95 = round(21/22·100) with a single fail).

## P4 Executive exception
Set Experience level select to Executive (same 2-page resume) → row ✓ hint `2 pages — within the 2-page length recruiters expect at executive level.` Grow to 3 pages → row ✗ `Your resume runs 3 pages — recruiters expect 2; use Auto-fit...` (no "(two only...)" clause since allowed==2).

## P5 Pre-measurement guard / no stale score
On fresh navigation, sample the row before pdfLength lands (~<800ms): row present and ✓ (neutral hint), never fail-flicker. After content change settles, score/row update (memo depends on pdfLength) — verify score changes from pre-measurement value to post-measurement value on the 2-page fixture.

## P6 Dashboard
/dashboard (or home) mini ATS scores render, no console crash (guard-pass path).

## P7 Regression + layout
R220 bullet-length, R219 punctuated, R218 quantified rows independent on same fixture. 375px scrollWidth==375 on /builder breakdown. Dark mode with explicit class="dark" guard; new row contrast ≥4.5:1.

## P8 Cleanup
Zero /api/ai/* generation calls; light theme; localStorage exactly ["honestcv.clientId","honestcv.qa"].

## Results (executed against production)
- P1 bundles exact (index-D8jLSuP7.js / ats-Dk3QfXSH.js / AtsChecker-BSxCnpa4.js / Builder-CHaCmi8f.js); Builder 22 rows, checker still 20 with no page-count row — PASS
- P2 fresh "Load example" (meter 0.57 page) → row ✓ out of the box — PASS (note: breakdown UI renders pass label only; pass hints are never displayed for any check — long-standing UI convention, not R221-specific)
- P3 2-page mid-level fixture (meter 1.55 pages ⇒ pages=2) → row ✗ with exact hint `Your resume runs 2 pages — recruiters expect 1 (two only at director/executive level); use Auto-fit or trim older roles and long bullets.`; in Priority fixes (Med badge + Fix →, Builder fixes carry no "+pts" chips — that chip UI is checker-only); Fix → experience anchor 112.39; arithmetic digit-exact 91 = round(20/22·100) with 2 fails — PASS
- P4 Executive via the experienceLevel select on same 2-page resume → row ✓, Structure 91→95 (single-row flip ≈ +4.5 = 100/22); grown to pages=4 (meter 3.07) → ✗ `Your resume runs 4 pages — recruiters expect 2; use Auto-fit…` (no "(two only…)" clause) — PASS (meter shows fractional length 3.07 = pages−1+fill for a 4-page PDF; hint's page count is the true PDF page count — consistent, not a bug)
- P5 fresh load pre-measurement: row ✓ guard + Structure 95, flips to ✗/91 once pdfLength lands (~1s); no fail-flicker, no stale score — PASS
- P6 /dashboard mini ATS scores render ("ATS 95/100"), no crash — PASS
- P7 R218/R219/R220 rows independent (bad bullet flips only R220 while page row unchanged); 375px scrollWidth 375; dark contrast 14.75:1 with class="dark" guard — PASS
- P8 only /api/ai/quota page-load read observed (allowed), zero generation calls; light theme; localStorage ["honestcv.clientId","honestcv.qa"] — DONE
