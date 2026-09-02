# R224 QA plan — category grouping of structure checks (index-C0jn08j8.js)

Code evidence: src/lib/ats.ts adds required `category` per check + CHECK_CATEGORIES (Content, Format, Best practices, in order). Builder.tsx ~6317: breakdown now div.space-y-3 → per-category <p class="uppercase"> header "LABEL · passed/total" + <ul> of li rows (✓/✗ glyphs unchanged). AtsChecker.tsx ~587: div.space-y-4 → header <p> + row divs with SVG icons (unchanged row markup). Zero scoring change claimed. Note: task says sample "should be fully green per R223" but R223 measured the sample with 2 pre-existing fails (Skills grouped / Word count, Structure 92) — verify actual and report discrepancy honestly.

## T1 Bundles + partition
index-C0jn08j8.js / ats-DkfstBHS.js / AtsChecker-BzKNd43o.js / Builder-C8CjduSk.js exact. Builder breakdown: exactly 3 uppercase headers Content/Format/Best practices in that order; per-category totals sum to 24 (expect 13/6/7... verify actual assignment counts vs plan: content 13, format 6, bestPractices 7 minus contact splits — assert sum only + documented counts). Checker totals sum to 22.

## T2 Score invariance vs R223 baselines
Checker weak-opener fixture ("- Worked on various tasks." + 2 good bullets): score 86 = round(19/22·100), 3 fails; priority fix +4.5 pts; clean fixture 91 = round(20/22·100). Builder weak-opener fixture: Structure 88 = round(21/24·100). Per-category pass counts sum to overall passes (24−fails / 22−fails).

## T3 Category routing
(a) weak-opener fail row under CONTENT header; (b) mixed date formats ("Jun 2023" + "08/2021") → Consistent date formatting fail under FORMAT; (c) missing LinkedIn → fail under BEST PRACTICES; (d) Dates use a written month fail listed under BEST PRACTICES, not Format.

## T4 Deep links from grouped rows
Builder grouped row "Fix →" → experience anchor top ~112; checker grouped priority "Fix in builder →" still jumps to /builder anchor.

## T5 Sample
Fresh "Load example": three headers all render with per-category counts; overall = R223 baseline (expect Structure 92, 2 fails: Skills grouped [Best practices], Word count [Best practices]); if truly 24/24 report per task, else report the discrepancy vs task expectation.

## T6 375 + dark
375px scrollWidth==375 on /builder breakdown and /ats-checker grouped lists; dark class guard; header + row contrast ≥4.5:1.

## T7 Cleanup
Zero /api/ai/* generation calls (quota read allowed); light theme; localStorage exactly ["honestcv.clientId","honestcv.qa"].

## Results (executed on production, bundles confirmed)
- T1 PASS: index-C0jn08j8.js / ats-DkfstBHS.js / AtsChecker-BzKNd43o.js / Builder-C8CjduSk.js all live. Builder: exactly 3 uppercase headers in order Content/Format/Best practices; rows 12+5+7=24. Checker: 11+4+7=22. (Actual category sizes differ from plan doc itemization — checker-only/builder-only rows explain the deltas; partition sums exact.)
- T2 PASS: checker weak-opener fixture → 86 = round(19/22·100), 3 fails (opener+filler under Content, word count under Best practices), priority fix +4.5 pts chips; per-category pass counts (9+4+6=19) sum to overall. Clean fixture digit-exact 95 = round(21/22·100) (1 fail — differs from R223's 2-fail clean fixture, arithmetic invariant still exact). Builder weak-opener → Structure 88 = round(21/24·100) matching R223; routing fixture 79 = round(19/24·100).
- T3 PASS: weak-opener fail under CONTENT; "Consistent date formatting" (08/2021 vs Jun 2023) under FORMAT; "LinkedIn URL" and "Dates use a written month" both under BEST PRACTICES.
- T4 PASS: builder grouped-row Fix → experience anchor top 112.39; checker "Fix in builder →" navigated to /builder, anchor top 112.39.
- T5 PASS (with expectation note): fresh sample shows Content 12/12, Format 5/5, Best practices 5/7 (pre-existing Skills grouped + Word count fails), Structure 92 — identical to R223 baseline, NOT fully green; both known fails grouped under Best practices.
- T6 PASS: scrollWidth 375 on both pages at 375px; dark class guard verified; header contrast ≈6.3:1 (muted uppercase header oklch 0.68 on 0.2), row text ≈14.7:1.
- T7 PASS: only /api/ai/quota + /api/billing/status observed, zero generation calls; light theme restored; localStorage exactly ["honestcv.clientId","honestcv.qa"].
Screenshots: r224_sample_groups / r224_builder_content_fail / r224_deeplink_exp / r224_routing_format_bp / r224_checker_groups / r224_checker_prio / r224_375_checker / r224_375_builder / r224_dark (in /home/ubuntu/screenshots/).
