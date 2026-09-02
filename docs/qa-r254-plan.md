# R254 QA plan — "Needs follow-up" filter on /jobs Tracked + ?attention=1 deep link

Code evidence: src/pages/Jobs.tsx:99–103 `seedAttention` from `?attention=1` → `tab='tracked'`, `followUpOnly=true`; :233–242 `trackedQueue` filter `(!followUpOnly || staleDays(e) !== null)` inside the JOB_STATUSES grouping with updatedAt-desc sort; :638–652 toggle chip inside the Tracked toolbar (role=group "Bulk actions on tracked jobs"), rendered BEFORE the Select… toggle when `attentionCount(pipeline)>0 || followUpOnly`, label `Needs follow-up (N)`, aria-pressed, title "Show only applications with no status update in 7+ days", active classes `border-amber-300 bg-amber-100 text-amber-800`; :771–772 empty message "No applications need a follow-up right now." Chip only exists when pipeline non-empty (outer :632 guard). Bundles: index-ChyeLImr.js / Jobs-BdLCF1QV.js / WorkspaceNav-lWUuioeo.js.

Method: production via CDP (suppress_origin=True, /home/ubuntu/audit-r1/cdp.py); reuse R253 fixtures (/home/ubuntu/qa/r253_pipeline*.json — f1 applied 6d, f2 applied 7d "Data Engineer @ Globex", f3 interviewing 8d "Platform Engineer @ Initech", f4 saved/f5 offer/f6 rejected 10d; oracle attentionCount=2); regenerate fixtures fresh (timestamps age) via r253_fixture.ts before seeding. tsx oracle also computes expected full grouped order. Zero /api/ai/* counter throughout. Screenshots r254_*.

## D0 Bundles
index-ChyeLImr.js entry; Jobs-BdLCF1QV.js chunk on /jobs; WorkspaceNav-lWUuioeo.js on /dashboard.

## D1 Deep link + filtered list
Seed full fixture, open /jobs?attention=1 → Tracked tab active; chip present with label exactly "Needs follow-up (2)", aria-pressed=true, title exact, classes contain border-amber-300 bg-amber-100 text-amber-800; chip is BEFORE the "Select…" button. Visible rows exactly ["Data Engineer","Platform Engineer"] in that order (applied group before interviewing) — f1 (6d), f4/f5/f6 excluded. Screenshot.

## D2 Toggle off/on
Click chip → aria-pressed=false, active classes gone; full queue order === oracle grouped order (saved f4, applied f2>f1 by updatedAt desc, interviewing f3, offer f5, rejected f6 → titles [SRE, Backend Engineer, Data Engineer, Platform Engineer, ML Engineer, Frontend Dev]; note f1 updatedAt(6d) newer than f2(7d) so applied order = Backend Engineer, Data Engineer). Click again → filtered back to the 2 stale rows. Screenshots.

## D3 Chip visibility rules
(a) Fresh-only fixture (no stale), plain /jobs → Tracked tab: no "Needs follow-up" chip; Select… still present. (b) Fresh-only + /jobs?attention=1: Tracked opens, chip visible "Needs follow-up (0)" with aria-pressed=true, list shows "No applications need a follow-up right now."; clicking chip off restores the 4 fresh rows. Screenshots.

## D4 Filtered-list interactions
Full fixture, ?attention=1: (a) change f2's row status select applied→offer → f2 drops out of filtered list (only Platform Engineer left), chip label becomes "Needs follow-up (1)". (b) Click Platform Engineer title → detail pane opens (shows "No update in 8 days — consider following up."). (c) "Select…" bulk mode on filtered subset → exactly 1 checkbox (Platform Engineer); select it → "1 selected" bar. Screenshots.

## D5 Regression
R253 nav badges with full fixture (/dashboard sidebar "2" + muted 6; after D4a mutation not required — reseed first). /jobs?q=python seeds the search box with "python" and stays on All tab, no chip forced. All tab shows no Needs follow-up chip.

## D6 375px + contrast
375×812 /jobs?attention=1: scrollWidth===375 with the chip row rendered. Light + dark rendered-pixel contrast of the ACTIVE chip (4× crop, 2/98 percentile) ≥4.5:1; dark via UI theme cycle (button title = current pref). Screenshots + crops.

## D7 Zero AI + cleanup
__aiReqs [] throughout (quota baseline allowed). Remove honestcv.jobPipeline/theme; final localStorage exactly ["honestcv.clientId","honestcv.qa"]; light theme. Results appended below.

## Results (production, CDP; recording down since R166)
- D0 PASS — entry index-ChyeLImr.js; /jobs chunk Jobs-BdLCF1QV.js; /dashboard chunk WorkspaceNav-lWUuioeo.js.
- D1 PASS — /jobs?attention=1 opened Tracked (ring-2 active tab "Tracked (6)"); chip "Needs follow-up (2)" (=== oracle attentionCount 2), aria-pressed=true, title exact, classes `border-amber-300 bg-amber-100 text-amber-800`, rendered before Select…; rows exactly ["Data Engineer","Platform Engineer"] (7d applied + 8d interviewing); 6d/saved/offer/rejected excluded. r254_d1_deeplink.png
- D2 PASS — toggle off: aria-pressed=false, active classes dropped, full queue restored in exact pre-R254 grouped order [SRE, Backend Engineer, Data Engineer, Platform Engineer, ML Engineer, Frontend Dev] (JOB_STATUSES groups, updatedAt desc within applied); toggle on: filtered pair back. r254_d2_toggleoff.png / r254_d2_toggleon.png
- D3a PASS — fresh-only pipeline, plain /jobs → Tracked: no chip, Select… still present. r254_d3a_nochip.png
- D3b PASS — fresh-only + ?attention=1: chip visible "Needs follow-up (0)" pressed, list shows "No applications need a follow-up right now."; toggling off restores 4 fresh rows and the chip disappears (count 0 & off). r254_d3b_empty.png / r254_d3b_off.png
- D4a PASS — filtered row status select Data Engineer applied→offer: entry dropped from filtered list (only Platform Engineer), chip live-updated to "Needs follow-up (1)". r254_d4a_dropout.png
- D4b PASS — detail pane opens from filtered row; "No update in 8 days — consider following up." r254_d4b_detail.png
- D4c PASS — Select… in filtered mode exposes exactly one checkbox ("Select Platform Engineer at Initech"); checking it shows "1 selected" bulk bar. r254_d4c_bulk.png
- D5 PASS — R253 regression: sidebar amber badge "2" + muted total "6" (/dashboard); /jobs?q=python seeds search box, stays on All tab, no follow-up chip on All. r254_d5_navbadge.png / r254_d5_qdeeplink.png
- D6 PASS — 375×812 /jobs?attention=1: scrollWidth === 375 with chip rendered (r254_375_filter.png). Active chip rendered-pixel contrast: light 6.36:1, dark 8.62:1 (computed oklch(.88 .11 88) on oklch(.33 .07 80), inverted palette) — both ≥4.5. r254_light_filter.png / r254_dark_filter.png + crops.
- D7 PASS — __aiReqs [] at every stage (quota baseline only); final localStorage exactly ["honestcv.clientId","honestcv.qa"]; light theme. r254_cleanup_final.png
