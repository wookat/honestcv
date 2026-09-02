# R242 QA plan — Job Type filter on /jobs

Code evidence: src/pages/Jobs.tsx — `typeFilter` state :110; filter applied only on All tab, after status exclusions and before the location direct/anywhere split: `afterExclude.filter(j => j.type.toLowerCase() === typeFilter)` :220–232; new `<select aria-label="Filter by job type">` between category select and location input, options ''/full time/part time/contract/freelance/internship/other, onChange resets selectedId :472–488. Tracked/status tabs bypass it (tab!=='all'). No persistence. Bundles: index-DAjToO8i.js / Jobs-DsFoZi22.js.

Method: fetch counter asserts zero /api/ai/* all round; fixture via /api/jobs/search intercept; screenshots (recording attempted once, service known down).

## Q0 Bundles
index-DAjToO8i.js + Jobs-DsFoZi22.js live on /jobs.

## Q1 Live "engineer" search
Count rows by "· contract" label in the full list, then select Contract in the new select. Expect: shown rows === contract-labelled rows only (count matches pre-computed count, ~3); previously selected job deselected (detail pane shows a currently shown job or empty state, not the old full-time one); switching back to All types restores the original row count. Screenshots before/after.

## Q2 Fixture type matrix
Inject 5 jobs: type "full time", "Full Time" (case), "part time", "" (empty), "contract". Expect: All types → 5 rows; Full time → exactly the 2 full-time jobs (case-insensitive match proven); Part time → 1; empty-type job hidden under EVERY specific selection, visible under All types. Screenshot of Full time selection.

## Q3 Composition
With fixture incl. varied locations: set type Full time + location filter "berlin" → direct matches section (Berlin full-time job) + "Anywhere" split section (remote/worldwide full-time) preserved, non-full-time Berlin job excluded. Add exclusion checkbox (mark one shown job Saved, exclude Saved) → it disappears while type+location stay applied. Sort "newest" still orders by postedAt. Screenshot.

## Q4 Tracked tab ignores type
Track (Save) a part-time fixture job; select type Contract; switch to Tracked tab → part-time job still listed. Back to All jobs → it's hidden (contract only). Screenshot.

## Q5 Regression
R241 sections still render (fixture with "About the role:" heading → uppercase h3). /jobs?q=Product%20Manager deep link seeds input + mount search with type select showing "All types" (value ''). Save→Tracked works (covered in Q4). Zero /api/ai/*.

## Q6 375px + dark
375×812: filter row (search/category/type/location…) wraps, iw/sw 375/375. Dark mode: core-pixel contrast of the type select (text vs field) — report ratio ≥4.5. Screenshots.

## Q7 Cleanup
Final localStorage exactly ["honestcv.clientId","honestcv.qa"], light theme, interceptors/viewport cleared by reload. Screenshots r242_*.png; results appended below.

## Results (production, index-DAjToO8i.js / Jobs-DsFoZi22.js)
- Q0 bundles live: index-DAjToO8i.js + Jobs-DsFoZi22.js — PASS
- Q1 live "engineer" (18 rows; API types: 11 full time / 2 part time / 3 contract / 2 freelance): Contract → exactly the 3 contract titles (Senior Independent AI Engineer / Architect, Senior Independent Software Developer, Head of Marketing & Communications); selecting a type deselected the open job ("Select a job to see the details." empty state); All types restored 18 — PASS
- Q2 fixture matrix (5 injected jobs): All types → 5 rows incl. empty-type job; Full time → 2 (lowercase "full time" AND "Full Time" case variant matched); Part time → 1; Contract → 1; Freelance/Other → 0; empty-type job hidden under every specific type — PASS
- Q3 composition: full time + location "berlin" → direct Alpha (Berlin) + "Open to any location (1)" Bravo (Remote — Worldwide); Berlin part-time job excluded; Hide: Saved toggle removed the Saved full-time job while type held; Newest sort ordered Bravo(1d) before Alpha(5d) under the type filter — PASS (note: exclusions are "Hide:" toggle buttons, not checkboxes)
- Q4 tracked ignores type: with Contract selected, Tracked tab still listed Charlie Part (part time) + Alpha Full Time; back to All → contract-only; select value retained — PASS
- Q5 regressions: R241 sections render (h3s ["About the role","Requirements"]); detail shows "· full time" label; /jobs?q=Product%20Manager seeds input, mount /api/jobs/search?q=Product+Manager, type select value "" (All types); Save → Tracked increments — PASS
- Q6 375×812 iw/sw 375/375 no overflow; dark type-select rendered-pixel contrast 15.71:1 — PASS
- Q7 zero /api/ai/* (counter [] throughout); final localStorage exactly ["honestcv.clientId","honestcv.qa"], light theme, Tracked (0), overrides cleared — PASS
Screenshots: r242_all_types / r242_contract / r242_deselect_empty / r242_fixture_fulltime / r242_type_location / r242_exclude_saved / r242_newest / r242_tracked_ignores_type / r242_r241_sections / r242_375_filters / r242_dark_jobs / r242_dark_select_crop / r242_deeplink_q / r242_regression_track (.png in /home/ubuntu/screenshots/)
