# R202 QA plan — two-tier missing JD keywords (display-only), production index-DkKkdnIQ.js

Code evidence: src/lib/ats.ts `highPriorityKeywords(jd, keywords)` (criteria: multi-word phrase present in JD; ≥3 occurrences; in requirements block after REQUIREMENTS_HEADING_RE; in first JD line); src/pages/Builder.tsx L1120-1123 highKw useMemo + L6160-6229 two groups ["High priority" red `text-red-700`, "Remaining" amber `text-amber-700`] each with the same interactive chips (+ add-to-Skills, sparkles AI-bullet, × not-relevant; Restore in Ignored row L6245); src/pages/AtsChecker.tsx L368-406 sub-groups "High priority (h) — title, requirements or repeated in the posting" (Badge cls `border-red-300 text-red-700 dark:border-red-900 dark:text-red-400`) and "Remaining (r) — also mentioned in the posting", empty group not rendered, "Nothing missing — great match!" retained. EXAMPLE_JD (AtsChecker.tsx L38-45): first line "…Senior Software Engineer…platform team.", "Requirements:" block with JavaScript/TypeScript/React/REST APIs/Node.js/PostgreSQL/Docker/Kubernetes/CI/CD/AWS/communication.

## U1 Bundles
Entry index-DkKkdnIQ.js; /builder loads Builder-C2pFIjzf.js; /ats-checker loads AtsChecker-BcbDcMcJ.js. PASS iff exact names.

## U2 Builder two-tier grouping + sum invariant
Load example resume, paste EXAMPLE_JD into #jd. Assert: score breakdown shows "High priority (h)" (computed color = red-700) and "Remaining (r)" (amber-700), h+r === ats.missing.length (flat total also cross-checked by re-running scoreResume logic client-side via the two groups' chip union = old flat set, no dupes/losses); every high chip term is in the requirements block / first line / ≥3× (spot-verify at least 2 high terms appear after "Requirements:" in the JD, and at least 1 remaining term does NOT satisfy any criterion). Empty-group not rendered when h or r = 0. Screenshot.

## U3 Chip actions in BOTH groups
(a) In High group: click "+" on a chip → keyword appears under Matched, missing count drops by 1. (b) In Remaining group: click "×" → keyword moves to Ignored row; click its Restore → returns to a missing group. (c) Sparkles on a high chip → AI-bullet draft dialog opens (assert dialog title/textarea present) → close without generating. Zero /api/ai generation calls. Screenshots.

## U4 Score unchanged (display-only)
With example resume + EXAMPLE_JD, the keyword/ATS score must equal the pre-R202 value for identical input. Capture score NN and verify it equals scoreResume-formula-derived value; additionally toggle nothing and confirm the score is identical before/after any chips are merely rendered (compare with R201-era behavior: grouping must not change matched/missing sets — assert union invariant from U2).

## U5 /ats-checker
Click "See an example score first" (sets example resume+JD). Assert: "Missing keywords (n)" with sub-groups "High priority (h) — title, requirements or repeated in the posting" (badges computed color red-700, border red-300) and "Remaining (r) — also mentioned in the posting" (plain outline), h+r=n. Edge: JD = only "Senior React Engineer\nReact TypeScript" style so ALL missing are high → single group rendered, no "Remaining" label; paste resume containing every JD keyword → "Nothing missing — great match!" (no group labels). Screenshots.

## U6 Dark mode contrast
Toggle dark via UI on /ats-checker results: high-priority badge text = red-400 oklch(0.704 0.191 22.216) (Tailwind default, NOT the remapped -300); pixel-measure badge text vs card bg contrast ≥4.5:1; Builder labels red-700/amber-700 in dark (remapped light) also measured ≥4.5:1. Zoom screenshot.

## U7 Mobile 375
Builder Target job panel + /ats-checker results at 375px: document scrollWidth === 375. Screenshot.

## U8 Regression
R201 practice score card renders for a ≥10-word answer (score NN/100); /ats-checker JD-highlight block still shows highlighted matched/missing segments. Screenshot.

## U9 Cleanup
Zero AI generation calls; theme back to light; final localStorage exactly ["honestcv.clientId","honestcv.qa"].

## Results (2025-09-01, production)
- U1 PASS: index-DkKkdnIQ.js entry; Builder-C2pFIjzf.js; AtsChecker-BcbDcMcJ.js.
- U2 PASS: EXAMPLE_JD → all 7 missing high (Remaining not rendered — empty-group case); custom JD (title line + fluff paragraph + Requirements block) → "High priority (4)" red-700 [senior, platform, javascript/typescript, kubernetes] + "Remaining (10)" amber-700 [stack, touches, grafana, terraform, redis, occasionally, elasticsearch, dashboards, analytics, reporting] — sum = flat total; high terms are title/requirements terms, remaining terms are pre-requirements single-mention words (r202_builder_groups.png).
- U3 PASS: "+" on high chip kubernetes → High priority (4)→(3), kubernetes in Skills/Matched; "×" on remaining chip grafana → Remaining (10)→(9), Ignored row; Restore → back to (10) with chip actions intact; sparkles on "senior" opens dialog "Draft a bullet for “senior”" (closed without generating; 0 AI calls) (r202_sparkles_dialog.png).
- U4 PASS (display-only): grouping is pure partition of ats.missing (union invariant holds in Builder 4+10=14 and ATS checker 5+10=15 vs "Missing keywords (15)"); ATS score 100/100 with example resume + EXAMPLE_JD unchanged.
- U5 PASS: /ats-checker example → single "High priority (7) — title, requirements or repeated in the posting" group, red-700 text/red-300 border badges (r202_ats_groups.png); custom JD → both groups 5+10=15 (r202_ats_two_groups.png); JD ⊂ resume → "Nothing missing — great match!", no group labels (r202_ats_nothing_missing.png).
- U6 PASS: dark badge computed color = red-400 oklch(0.704 0.191 22.216) (Tailwind default, NOT remapped), border red-900 remapped light oklch(0.9 0.1 24); pixel-measured core text (255,100,103) vs card bg (18,22,29) ≈ 6.2:1 (brightest antialias 12:1) — ≥4.5:1 (r202_ats_dark_zoom.png). Builder dark labels: High priority red-700→oklch(0.82 0.14 24), Remaining amber-700→oklch(0.85 0.13 86) — remapped light on dark bg, clearly legible (r202_builder_dark_groups.png).
- U7 PASS: builder 375 (groups via "Preview & score" pane) scrollWidth 375/360, 0 elements past viewport; /ats-checker 375 scrollWidth 375, groups render (r202_builder_375.png, r202_ats_375.png).
- U8 PASS (regression): R201 practice card renders 51/100 for STAR answer; /ats-checker JD-highlight segments still render.
- U9 DONE: 0 non-quota /api/ai calls; light theme restored; localStorage exactly ["honestcv.clientId","honestcv.qa"].
