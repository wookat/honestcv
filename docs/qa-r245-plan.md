# R245 QA plan — "Repeated skills" strip on the Tracked tab

Code evidence: src/pages/Jobs.tsx — `termRegex` factored :197–203 and reused by the R243 afterSkills filter :273; `repeatedSkills` :206–223 (whole pipeline, per-job Set dedupe, case-insensitive key with canonical casing = first occurrence, keep count≥2, sort count desc then `localeCompare`, cap 12); strip :612–655 renders only when `tab==='tracked' && repeatedSkills.length>0` — "Repeated skills:" label with explanatory title, chips `tag ×N`, `aria-pressed` mirrors filter, amber `size-1.5 bg-amber-500` dot + aria-label "Not on your resume yet" + title suffix " — not on your resume yet" when resumeText non-empty and `termRegex(tag)` fails against it; onClick = `toggleSkillTerm` (adds/removes term, switches to All tab). Bundles: index-CUz8Yfk1.js / Jobs-D_4am-c9.js.

Method: fetch counter asserts zero /api/ai/*; live tracked jobs from an "engineer" search verified against the /api/jobs/search payload; deterministic fixtures via fetch interception for casing/dedupe/cap/legacy; resume seeded via localStorage `honestcv.resume` (skills edited, restored at cleanup); screenshots (recording attempted once, service known down).

## U0 Bundles
index-CUz8Yfk1.js + Jobs-D_4am-c9.js live on /jobs.

## U1 Live: track 2 real jobs sharing tags → strip appears with correct counts
Search "engineer", Save two Lemon.io jobs whose payload tags overlap heavily (both 24-tag). Tracked tab → "Repeated skills:" strip with exactly the payload-computed shared tags: counts ×2, sorted count desc then alpha, capped at 12 chips. With only ONE job tracked → strip absent (count≥2 gate). Screenshot both states.

## U2 Fixture matrix (intercept /api/jobs/search, track fixtures)
Fixtures: F1 tags ['React','sql','go','python'], F2 tags ['react','REACT','sql','java'] (intra-job dupe), F3 tags [] , F4 no tags field (legacy).
- Track F1+F2 → chips exactly `React ×2` (canonical casing = first occurrence 'React'; intra-job dupe in F2 did NOT make ×3) and `sql ×2`; 'go','python','java' absent (count 1).
- Sort: both ×2 → alphabetical: React before sql? localeCompare('React','sql') — 'R'<'s' → ["React ×2","sql ×2"].
- Track F3+F4 too → same chips, no crash (legacy/tag-less contribute nothing).
- Untrack F2 → strip disappears entirely (<2 shared).
- Cap: separate fixture pair sharing 14 tags → exactly 12 chips.
Screenshots.

## U3 Resume dot
Seed resume draft whose skills include "React" (and word "JavaScript" but NOT standalone "java"): `React ×2` chip has NO amber dot; `sql ×2` (absent from resume) has dot with aria-label "Not on your resume yet" + title suffix; with F2's `java` scenario: make java shared (adjust fixture) → java chip HAS dot despite resume containing "JavaScript" (word boundary). Empty resume text → no dots at all. Screenshot showing dot vs no-dot.

## U4 Chip click semantics
Click `sql ×2` on Tracked tab → switches to All tab, skills input == "sql", rows narrowed; back to Tracked → chip aria-pressed=true/active styling; click again → term removed (input ""), pressed=false. Pre-typed "SQL" then chip click → removed (case-insensitive dedupe).

## U5 Regression
Tracked grouping/status headers still render (Saved group label); R244 detail chip row still works (chip click from detail); R243 filter semantics unchanged via termRegex reuse — fixture: "java" excludes JavaScript-only job, "c++" literal matches, AND of two terms; R242 type filter standalone. Labelled Regression screenshots.

## U6 375px + dark
375×812 Tracked tab with strip: chips wrap, iw==sw==375. Dark mode: rendered-pixel contrast of an inactive chip (report ratio) and visibility of the amber dot inside the chip button (amber vs chip bg ratio ≥ 3 expected for a non-text indicator; report measured value). Screenshots.

## U7 Zero AI + cleanup
Fetch counter [] all round. Untrack all QA jobs, restore original resume draft state, final localStorage exactly ["honestcv.clientId","honestcv.qa"], light theme (3-state toggle: cycle until aria-label starts "Light theme"), overrides cleared by reload. Screenshots r245_*.png; results appended below.

---

## Results (executed against production, bundles index-CUz8Yfk1.js / Jobs-D_4am-c9.js)

- U0 bundles: index-CUz8Yfk1.js + Jobs-D_4am-c9.js live — PASS
- U1 live: 1 tracked job → strip absent; tracking 2 Lemon.io 24-tag jobs (Senior React Full-stack Developer + Senior QA Engineer, 20 shared tags in payload) → strip shows exactly the payload-computed top-12: [".Net ×2","android ×2","C ×2","C# ×2","C++ ×2","data science ×2","golang ×2","ios ×2","java ×2","javascript ×2","node.js ×2","php ×2"] — expected == observed (cap-12 + count-desc/localeCompare sort proven live) — PASS (r245_one_tracked_nostrip.png, r245_live_strip.png)
- U2 fixture: F1 ['React','sql','go','python','java'] + F2 ['react','REACT','sql','java'] + F3 tags:[] + F4 legacy no-tags → chips exactly ["java ×2","react ×2","sql ×2"]; intra-job dupe did NOT make react ×3; count-1 tags absent; legacy/tag-less contributed nothing, no crash; untracking F2 (status button → none) → strip disappeared entirely — PASS (r245_fixture_strip.png, r245_untrack_nostrip.png). Note: canonical casing rendered "react" (F2 was the most recent pipeline entry — first occurrence in pipeline iteration order), consistent with implementation.
- U3 resume dot: no resume → all dots absent; seeded resume skills "React, JavaScript, TypeScript" → react ×2 NO dot; sql ×2 and java ×2 HAVE amber dot with aria-label "Not on your resume yet" and title suffix " — not on your resume yet"; java dotted despite resume "JavaScript" (word boundary) — PASS (r245_resume_dots.png)
- U4 chip click: sql chip on Tracked → All tab, skills input "sql", rows narrowed to the 2 live sql-matching jobs; back on Tracked chip aria-pressed=true + active styling; second click → input "", pressed=false, full list restored; pre-typed "SQL" then chip click → removed case-insensitively (input "") — PASS (r245_chip_click_all.png, r245_chip_active_tracked.png)
- U5 regression: status tabs ["All jobs","Tracked (3)","Saved (3)","Applied (0)",…] intact; R243 fixture: "java" → [Java Backend Dev] only (JavaScript-only job excluded, word boundary); "c++" → [Systems Dev] (literal); "java, spring" AND → [Java Backend Dev]; R242 Contract → the 2 contract fixtures; R244 detail "Skills:" chip click → input "java", board narrowed — PASS (r245_regression_r243_java.png, r245_regression_r244_chip.png)
- U6 375×812: strip wraps, innerWidth/scrollWidth 375/375 (r245_375_strip.png); dark mode: chip text contrast 5.42:1, amber dot vs chip bg 5.13:1 (both ≥ thresholds) — PASS (r245_dark_strip.png, r245_dark_chip_crop.png)
- U7 zero AI: __ai [] all round; cleanup: final localStorage exactly ["honestcv.clientId","honestcv.qa"], light theme, Tracked (0) — DONE (r245_cleanup_final.png)

Recording: none — service still down (ffmpeg exits immediately; attempted once).
Disclosure: mid-run the fixture fetch interceptor appeared inert twice — root cause was my automation (search not re-submitted / input set via insertText instead of native setter after a reload), not the product; reruns with the native-setter + requestSubmit pattern behaved deterministically.
