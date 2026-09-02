# R244 QA plan — skill tag chips in /jobs detail pane

Code evidence: src/lib/jobs.ts:20–21 `tags?: string[]`; src/pages/Jobs.tsx — `tagsExpandedId` :112; `toggleSkillTerm` :232–239 (sanitizes commas/whitespace, case-insensitive dedup toggle on the R243 skills input, `setTab('all')`); skills haystack now `title\ndescription\ntags.join('\n')` :243; chip row :780–815 — renders only when `selected.tags?.length > 0`, "Skills:" label, first 10 chips, `+N more` button sets `tagsExpandedId=selected.id` (so switching jobs collapses), each chip is a `<button aria-pressed>` with title `Filter jobs by "tag"` / `Remove "tag"...`, active = bg-primary. Bundles: index-D1Dl9Hgl.js / Jobs-Ck_QXVSj.js.

Method: fetch counter asserts zero /api/ai/*; expected counts computed from the /api/jobs/search payload with the R243 regex over title+description+tags; fixture interception for deterministic edge cases; screenshots (recording attempted once, known down).

## T0 Bundles + live tags
index-D1Dl9Hgl.js + Jobs-Ck_QXVSj.js live; /api/jobs/search payload for "engineer" includes non-empty `tags` arrays (worker v4). If live payload lacks tags, escalate (cache not bumped) and fall back to fixture for UI tests.

## T1 Live chip row + expansion
Select a job with >10 tags (from payload). Expect: "Skills:" row under company line; exactly 10 chips + `+N more` where N = tags.length−10; click `+N more` → all tags shown, button gone; switch to another job → its row collapsed back to ≤10 (expansion keyed to id). Screenshots.

## T2 Chip click seeds filter (haystack proof)
Pick a tag on the selected job NOT present in its title/description prose (verify against payload). Click chip → skills input value == tag; board narrows to expected count (regex over title+description+tags); **clicked job still listed** (would vanish if haystack not extended). aria-pressed=true + active bg-primary styling visible in screenshot.

## T3 Toggle off + dedup
Click same chip again → term removed, input updated (other terms preserved), aria-pressed=false. Pre-type the tag in different case in the input, click chip → term removed (case-insensitive dedup), not duplicated.

## T4 Multi-term AND + composition
With a typed term + a clicked chip → input "typed, tag", rows = AND intersection (counts vs payload). Compose with R242 type select + location "berlin"-style split + Hide: Saved + Newest (fixture) → exact titles/order. Screenshot.

## T5 Tracked tab chip click switches to All
Save a job; on Tracked tab open its detail, click a chip → tab switches to All jobs with skills filter applied (rows narrowed). Screenshot.

## T6 No tags → no row, no crash
Fixture job with `tags:[]` and one with tags omitted (legacy) → detail renders with NO "Skills:" row, actions/description intact, no console error.

## T7 Regression
R243 typed semantics on fixture ("java" word boundary excludes JavaScript-only; "c++" literal); R242 type filter; R241 sections (h3 from "About the role:"); R240 /jobs?q=Product%20Manager deep link seeds input+search, skills empty.

## T8 375px + dark
375×812 with chip row visible: iw==sw==375. Dark mode: rendered-pixel contrast of an inactive chip and the active (bg-primary) chip — report ratios ≥4.5. Screenshots.

## T9 Zero AI + cleanup
Fetch counter [] all round. Untrack QA jobs; final localStorage exactly ["honestcv.clientId","honestcv.qa"]; light theme; overrides cleared by reload. Screenshots r244_*.png; results appended below.

## Results (production, index-D1Dl9Hgl.js / Jobs-Ck_QXVSj.js)
- T0 bundles live; live /api/jobs/search q=engineer: 18/18 jobs carry tags (worker v4), e.g. 24-tag Lemon.io listings — PASS
- T1 chip row: "Skills:" label + exactly 10 chips + "+14 more" on a 24-tag job; expand → 24 chips, more-button gone; switching to another job shows that job collapsed (10 + "+14 more") — PASS. Observation: returning to a previously expanded job shows it still expanded (tagsExpandedId retained per job id; consistent with implementation, switching collapses the newly selected job as specced)
- T2 chip seeds filter + haystack proof: tag "ruby/rails" (absent from job prose, verified vs payload) → input "ruby/rails", 6 rows exactly matching payload prediction incl. the clicked job itself; aria-pressed=true, title 'Remove "ruby/rails"...', active bg-primary styling in screenshot — PASS
- T3 toggle off: second click → input "", pressed=false, 18 rows; typed "RUBY/RAILS" then chip click → removed (case-insensitive dedup), input "" — PASS
- T4 multi-term AND: typed "python" + clicked "ruby/rails" chip → input "python, ruby/rails", 5 rows == payload prediction; fixture composition: java chip + Full time + location berlin → direct [Java Backend Dev] + "Open to any location (1)" [Data Dev]; Hide: Saved removed saved job; Newest ordered 2d before 5d — PASS
- T5 tracked chip click: on Tracked tab, clicking "sql" chip switched to All jobs tab with input "sql" and narrowed rows [Data Dev, Java Backend Dev] — PASS
- T6 no tags: fixture tags:[] (Systems Dev) and tags-omitted legacy (Legacy Dev) → no "Skills:" row, detail renders, no errors — PASS
- T7 regression: "java" word boundary (JavaScript-tagged/prose job hidden); "c++" literal → [Systems Dev] (rerun after clearing a leftover type filter from the composition step — first run was confounded by my own test state, not a product issue); R242 Contract → [Systems Dev]; R241 h3 ["About the role"]; R240 ?q=Product%20Manager seeds input + mount search, skills empty, 18 rows — PASS
- T8 375×812 with chip row: iw/sw 375/375 — PASS; dark mode: inactive chip contrast 5.16:1, active chip (dark text on primary blue) 6.65:1 — PASS. Note: theme toggle is 3-state (light→dark→system); restore by cycling until aria-label starts "Light theme"
- T9 zero /api/ai/* ([] throughout); untracked QA fixture jobs AND one real job accidentally saved by a stray automation click; final localStorage exactly ["honestcv.clientId","honestcv.qa"] (honestcv.theme removed too), light theme, Tracked (0) — PASS
Screenshots: r244_chips_collapsed / r244_chips_expanded / r244_chips_collapsed_switch / r244_chip_active / r244_multi_and / r244_no_tags / r244_composition / r244_tracked_chip / r244_r241_sections / r244_375_chips / r244_dark_chips / r244_dark_active_crop / r244_deeplink_q (.png in /home/ubuntu/screenshots/)
