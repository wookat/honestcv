# R251 QA plan — per-job Tailoring report in the /jobs detail pane

Code evidence: src/lib/ats.ts:757–780 `matchReport(resumeTextRaw, jd)` (same extractKeywords/phrase-substring/token-membership/rounding as matchScore:750–754; null when JD yields no keywords); src/pages/Jobs.tsx:320–330 `selectedReport` — targeted copy when the pipeline entry links a still-existing resumeVersionId (`resumeToPlainText(visibleResume(version.data))`), else the draft `resumeText`; null when text empty; :957–968 disclosure button "Tailoring report"/"Hide tailoring report" with aria-expanded, session state `reportOpenId` keyed per job id; :969–1025 expanded card: "Against the targeted copy for this job / your current resume draft: covered X of Y job keywords.", emerald "All job keywords covered." when none missing, else amber "High priority missing:" chips (bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300) + muted "Also missing:" chips, each capped at 10 with "+N more"; resume.ts:1126–1148 ResumeVersion {id,name,updatedAt,data}. Bundles: index-wxiNqCSi.js / Jobs-CuCbC2lk.js.

Method: production via CDP (suppress_origin=True); deterministic fixtures seeded in localStorage (honestcv.resume draft, honestcv.jobPipeline with fixture jobs incl. type+category, honestcv.resumeVersions targeted copy); oracle via `npx tsx --tsconfig tsconfig.app.json` against src/lib/ats.ts + resume.ts in this checkout; fetch counter asserts zero /api/ai/* completions; screenshots r251_* (recording known down, attempted once).

Fixture jobs (descriptions crafted so draft vs targeted copy give different pct and mixed HP/non-HP missing; one JD with >10 HP missing for the cap; one JD fully covered by draft; one JD with no extractable keywords e.g. all stopwords/short).

## A0 Bundles
index-wxiNqCSi.js + Jobs-CuCbC2lk.js live on /jobs.

## A1 Draft path (primary)
Seed draft resume + tracked fixture job j1 (no resumeVersionId). Open j1 detail → header "N% keyword match with your resume" where N === oracle matchReport(draftText, jd1).pct === matchScore; click "Tailoring report" (aria-expanded true → label "Hide tailoring report") → card text "Against your current resume draft: covered X of Y job keywords." with X/Y = oracle covered/total; amber "High priority missing:" chips exactly oracle missing∩high (order preserved); muted "Also missing:" chips exactly the rest. Screenshot.

## A2 Targeted-copy path + fallback
j2 pipeline entry links resumeVersionId v1 (copy's text differs from draft). Header shows "Targeted copy: M%"; report says "Against the targeted copy for this job" with numbers === oracle matchReport(copyText, jd2) (and ≠ draft numbers). Then remove v1 from honestcv.resumeVersions (keep the pipeline link) + reload → falls back to draft: "Against your current resume draft" with draft numbers.

## A3 Caps / all-covered / absence
(a) j3 JD with >10 HP missing → exactly 10 amber chips + "+N more" (N = oracle count −10). (b) j4 JD fully covered by draft → emerald "All job keywords covered.", no chips. (c) Empty draft (and no version) → no "Tailoring report" button; JD yielding no keywords → no button. Restore draft after.

## A4 Disclosure semantics
Open report on j1 → switch to j2 → report collapsed (button says "Tailoring report", aria-expanded false); back to j1 → still collapsed (session reset on switch); toggle open/closed twice on one job works.

## A5 Regression
R249 bulk bar + selection still works on Tracked; R244 detail skill chips; R245 repeated-skills strip; R241 structured JD sections in detail pane; per-row status select changes status.

## A6 375px + themes
375×812 with report open: document.documentElement.scrollWidth === 375. Dark via UI toggle: rendered-pixel contrast of amber chip text (canvas-composite exact colors if percentile method borderline), target ≥4.5; light theme too. Screenshots + crops.

## A7 Zero AI + cleanup
__aiReqs [] (baseline GET /api/ai/quota allowed). Remove honestcv.resume/jobPipeline/resumeVersions/resumeHistory/theme; final localStorage exactly ["honestcv.clientId","honestcv.qa"]; light theme. Results appended below.

## Fix re-verify plan (bundles index-GykZOqPt.js / Jobs-BU7LmNMr.js)
Code evidence: src/pages/Jobs.tsx:994 HP chip now `rounded-full bg-amber-100 px-1.5 py-0.5 text-amber-800 dark:bg-amber-950` (dark text override dropped; `text-amber-800` computes to light oklch(.88 .11 88) in the inverted dark palette per index.css:151).
- F0: new bundles live on /jobs.
- F1: reseed the A1 fixtures (draft + jd1 job); open the report in dark mode (UI theme toggle); rendered-pixel contrast of a HP chip crop ≥4.5:1 (expect ≈ light text ~oklch .88 on amber-950 bg). Screenshot r251_fix_dark_*.
- F2: light theme chip unchanged: computed color amber-800 oklch(0.473 0.137 46.201) on amber-100; pixel contrast ≈6.36:1 (±0.3). Screenshot r251_fix_light_*.
- F3: sanity: report content still oracle-exact for jd1 (covered 7 of 17, HP 9 chips, Also missing build).
- Cleanup: light theme, localStorage exactly ["honestcv.clientId","honestcv.qa"].

## Results (executed against production, bundles index-wxiNqCSi.js / Jobs-CuCbC2lk.js)
- A0 bundles live — passed
- A1 draft path: header "41% keyword match with your resume" === oracle pct/matchScore; "Against your current resume draft: covered 7 of 17 job keywords."; HP chips exactly [senior,kubernetes,terraform,graphql,apis,value,redis,kafka,matters] (order preserved); "Also missing: build" — passed
- A2 targeted copy: header "Targeted copy: 92% keyword match"; "Against the targeted copy for this job: covered 12 of 13"; HP chip [welcome] — passed. Fallback after deleting v1: header back to "8% keyword match with your resume", "Against your current resume draft: covered 1 of 13", HP 10 chips + "+1 more", Also missing [kubernetes] — passed
- A3a cap: 15 HP missing → exactly first-10 oracle chips + "+5 more" — passed
- A3b all covered: "covered 8 of 8" + emerald "All job keywords covered." (text-emerald-700 dark:text-emerald-400), no chips — passed
- A3c keyword-less JD → no button; A3d empty draft → no button, no header % — passed
- A4 disclosure: aria-expanded true/false with label swap; switching to another job shows that job collapsed — passed. NOTE: returning to the originally opened job shows its report still open (reportOpenId is never reset on selection change; matches code, but "switching jobs collapses it" is only true for the newly selected job) — observation
- A5 regression: R249 bulk bar/5 checkboxes/"2 selected|Move to…|Untrack 2|Clear"; R241 Requirements section; R244 tag chips (after seeding job.tags); R245 "Repeated skills: Python ×2 SQL ×2"; per-row status select saved→interviewing persisted — passed
- A6 375×812 with report open: scrollWidth 375 — passed. Dark mode: HP label (amber-400) 10.03:1 passed; muted chip 5.42:1 passed; **HP chip text 2.27:1 FAILED** — index.css dark palette remaps --color-amber-300 to oklch(.48 .1 80) (dark text tone), so dark:bg-amber-950 + dark:text-amber-300 = dark-on-dark. In this inverted palette the light text shades are amber-600..900 (e.g. amber-300→dark, amber-800→oklch(.88 .11 88) light). Fix: use dark:text-amber-600/700/800 (or drop the dark: text override — text-amber-800 computes light in dark mode). Light theme chip 6.36:1 — passed
- A7 zero /api/ai/* completions at every instrumented stage (__aiReqs []); cleanup exact ["honestcv.clientId","honestcv.qa"], light theme — done

## Fix re-verify results (bundles index-GykZOqPt.js / Jobs-BU7LmNMr.js)
- F0 new bundles live (index-GykZOqPt.js in script tags; Jobs-BU7LmNMr.js loaded as the /jobs chunk) — passed
- F1 dark HP chip: class now `bg-amber-100 ... text-amber-800 dark:bg-amber-950` (no dark text override); computed color oklch(0.88 0.11 88) (light) on amber-950; rendered-pixel contrast **10.46:1** (text rgb(246,212,128) on rgb(70,25,1)) — passed (was 2.27:1)
- F2 light chip unchanged: computed amber-800 oklch(0.473 0.137 46.201) on amber-100; pixel contrast **6.36:1** — identical to pre-fix — passed
- F3 report sanity: "covered 7 of 17 job keywords.", HP chips [senior,kubernetes,terraform,graphql,apis,value,redis,kafka,matters], "Also missing: build" — oracle-exact — passed
- Cleanup: light theme restored via UI toggle; final localStorage exactly ["honestcv.clientId","honestcv.qa"] — done
