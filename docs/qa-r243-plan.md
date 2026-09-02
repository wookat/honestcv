# R243 QA plan — Skills filter on /jobs

Code evidence: src/pages/Jobs.tsx — `skillsFilter` state :111; terms = comma-split/trim/filter(Boolean) :225–228; applied on All tab only, after type filter and before the location split :229–241 — keep job iff EVERY term matches `title\n description` lowercased, regex chars escaped, `\b` prepended/appended only when term starts/ends with a word char (so "java" ≠ javascript; "c++"/".net" are substring-ish literal); input `aria-label="Filter by skills"`, placeholder "Skills, e.g. React, SQL", between type select and location input :507–514; onChange does NOT reset selectedId. Location split consumes `afterSkills` :247–256. Bundles: index-L3Kn0bHI.js / Jobs-NXP8D7t6.js.

Method: fetch counter asserts zero /api/ai/*; type/skills assertions cross-checked vs the /api/jobs/search payload; fixtures via fetch interception; screenshots (recording attempted once; service known down since R166).

## S0 Bundles
index-L3Kn0bHI.js + Jobs-NXP8D7t6.js live on /jobs.

## S1 Live "engineer" search
Compute expected counts from API payload (title+description word-boundary regex for "react", then "react"+"typescript" AND). Type "react" into the skills input → row count == expected; add ", typescript" → smaller count == expected AND ⊆ react set; verify a job selected before typing stays selected (no selectedId reset); clear input → full list restored. Screenshots.

## S2 Fixture matrix (intercept /api/jobs/search)
Jobs: (a) "Java Backend Dev" desc mentions Java only; (b) "Frontend Dev" desc mentions JavaScript only; (c) "Systems Dev" desc "C++ and .NET experience"; (d) "Data Dev" desc "java and sql" lowercase.
- "java" → shows (a),(d) only; (b) hidden (word boundary: "java" must not match "JavaScript").
- "JAVA" → same rows (case-insensitive).
- "c++" → (c) only; ".net" → (c) only (literal, escaped).
- "java, sql" → (d) only (AND, not OR — (a) lacks sql).
- "java,  , sql , " (trailing comma/spaces/empty term) → same as "java, sql".
Screenshots.

## S3 Composition
Fixture with types+locations: skills term + type Full time + location "berlin" → direct Berlin section + "Open to any location" split preserved, both respecting skills; Hide: Saved toggle removes a saved matching job; Newest sort orders remaining by postedAt. Assert exact row titles/order. Screenshot.

## S4 Tracked tab ignores skills
Save a job NOT matching the current skills term; with the term active, Tracked tab still lists it; back on All it's hidden. Screenshot.

## S5 Regression
R242 type filter still works standalone (fixture type counts); R241 sections (fixture with "About the role:" → uppercase h3); /jobs?q=Product%20Manager deep link seeds input + mount search, skills input empty; Save→Tracked increments (covered in S4).

## S6 375px + dark
375×812: filter row (search/category/type/skills/location) wraps, iw==sw==375. Dark: rendered-pixel contrast of skills input (typed text vs field) — report ratio ≥4.5. Screenshots.

## S7 Zero AI + cleanup
Fetch counter [] all round. Final localStorage exactly ["honestcv.clientId","honestcv.qa"], light theme, Tracked (0), overrides cleared by reload. Screenshots r243_*.png; results appended below.

## Results (production, index-L3Kn0bHI.js / Jobs-NXP8D7t6.js)
- S0 bundles live: index-L3Kn0bHI.js + Jobs-NXP8D7t6.js — PASS
- S1 live "engineer" (18 rows): "react" → 6 rows, exactly the API-predicted titles; ", typescript" appended → 5 rows == predicted AND-subset; previously selected job (Senior React Full-stack Developer) stayed selected while typing (no selectedId reset); clearing restored 18 — PASS
- S2 fixture matrix (4 injected jobs): "java" → [Java Backend Dev, Data Dev], JavaScript-only job hidden (word boundary); "JAVA" identical (case-insensitive); "c++" → [Systems Dev]; ".net" → [Systems Dev] (literal/escaped); "java, sql" → [Data Dev] (AND); "java,  , sql , " → [Data Dev] (empty/whitespace terms ignored); cleared → all 4 — PASS
- S3 composition: skills "java" + type Full time + location "berlin" → direct [Java Backend Dev] + "Open to any location (1)" [Data Dev]; Hide: Saved removed the saved Berlin job while skills+type+location held; Newest ordered Data Dev(2d) before Java Backend Dev(5d) — PASS
- S4 tracked ignores skills: skills "sql" hides saved Java Backend Dev on All tab, but Tracked tab still lists it; back to All → hidden; skills value retained — PASS
- S5 regression: R242 type filter standalone (Contract → [Systems Dev]); R241 sections (h3 ["About the role"]); /jobs?q=Product%20Manager seeds input + mount /api/jobs/search?q=Product+Manager with skills input empty, 18 rows — PASS
- S6 375×812 iw/sw 375/375 with skills typed, filter row wraps; dark skills-input rendered-pixel contrast 12.43:1 — PASS
- S7 zero /api/ai/* (counter [] throughout); final localStorage exactly ["honestcv.clientId","honestcv.qa"], light theme, Tracked (0), overrides cleared — PASS
Note: dark-theme toggle required a second click attempt (first eval reported dark:false; second identical click applied it) — same behavior seen in R242, not a filter regression.
Screenshots: r243_live_react / r243_live_react_ts / r243_fixture_java / r243_fixture_cpp / r243_composition / r243_hide_saved / r243_newest / r243_tracked_ignores_skills / r243_r241_sections / r243_375_filters / r243_dark_jobs / r243_dark_skills_crop / r243_deeplink_q (.png in /home/ubuntu/screenshots/)
