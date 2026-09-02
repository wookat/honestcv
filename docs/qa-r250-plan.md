# R250 QA plan — tiered keyword feedback in interview practice

Code evidence: src/lib/interviewAnalysis.ts:263–271 (`analyzeAnswer` keywords now `{covered, missing, highPriorityMissing: missing.filter(k=>high.has(k))}` via `highPriorityKeywords(jd,kws)`), :280–292 score formula unchanged (lengthPts + starPts + kwPts(round(covered/total*30)) + deliveryPts, capped 100); src/lib/ats.ts:681–742 extractKeywords/highPriorityKeywords (R202: multi-word phrase in JD, ≥3 repeats, requirements block, first line); src/pages/Builder.tsx:7989 analyzeAnswer(answer, resume.jobDescription, resume.ignoredKeywords), :8566–8592 UI — counter line "Job keywords used: X/Y" with old "— try working in: <missing.slice(0,5)>" suffix only when highPriorityMissing.length===0; amber `text-amber-700 dark:text-amber-400` line "High priority: <hpm.slice(0,5)>"; muted "Also mentioned: <non-hp missing.slice(0,5)>" only when missing>hpm. Bundles: index-ChprzR2u.js / Builder-F4Ymczjq.js.

Method: production via CDP (suppress_origin=True); JD pasted into the Target job panel (resume.jobDescription); answers typed into the interview-practice textarea; expected keyword sets and score computed locally with `npx tsx` against the same lib in this checkout (independent oracle) plus hand formula for the score; cross-check High-priority tier against the Target-job keyword panel's "High priority" list; fetch counter asserts zero /api/ai/* completions; screenshots (recording known down, attempted once).

Fixture JD (first line = title phrase; "python" repeated ≥3×; requirements block with terraform/graphql):
```
Senior Python Developer
We build data pipelines in Python. Python experience matters here. We use Kubernetes daily.
Requirements
- Terraform modules
- GraphQL APIs
```
Expected sets computed via tsx before UI assertions; plan pass criteria are equality with the oracle output, with concrete values recorded at execution.

## Z0 Bundles
index-ChprzR2u.js + Builder-F4Ymczjq.js live on /builder.

## Z1 Tiered lines (primary)
Seed resume draft with the fixture JD; open interview practice; type an answer that covers some keywords but misses a mix of high-priority (e.g. python, terraform) and non-high-priority ones. Assert:
- counter "Job keywords used: X/Y" matches oracle covered/total; NO "try working in" suffix;
- amber line exactly `High priority: <oracle missing∩high, order of missing, ≤5>` with classes text-amber-700 dark:text-amber-400;
- muted line exactly `Also mentioned: <oracle missing minus high, ≤5>`;
- High-priority set equals the Target job keyword panel's High-priority tier ∩ missing (cross-check in ATS/keyword panel UI).
Screenshot.

## Z2 Fallback / caps / absence
(a) Answer covering all high-priority missing but not all missing → single old-style "— try working in: <remaining ≤5>" suffix, no amber line, no "Also mentioned". (b) Answer covering everything → counter only "X/X", none of the three suggestion forms. (c) Empty JD → no keyword row at all (no "Job keywords used"). (d) A JD/answer combo with >5 high-priority missing → amber line lists exactly the first 5.

## Z3 Score bit-identical
For the Z1 answer, recompute expected score by hand from the formula (lengthPts/starPts/kwPts/deliveryPts using oracle covered/missing + regex checks via tsx) → UI "Practice score: N/100" equals it exactly. Also assert tsx `analyzeAnswer(...).score` === UI score for all Z1/Z2 answers.

## Z4 Regression — delivery rows + STAR
With a timed answer (Start 2-minute window → stop): pace (wpm + band), speaking-time %, quick fillers, filler sounds, tone rows render as before with values matching tsx analyzeDelivery/analyzeQuickFillers/analyzeFillerSounds/analyzeTone; STAR chips (Situation/Action/Result) match oracle star flags.

## Z5 375px + dark
375×812: practice card wraps, document.documentElement.scrollWidth === 375. Dark via UI toggle: rendered-pixel contrast of the amber "High priority:" line (target ≥4.5, crop with scrollX/scrollY correction); light-theme amber line contrast too. Screenshots + crops.

## Z6 Zero AI + cleanup
__aiReqs [] (baseline GET /api/ai/quota allowed, zero completions). Remove honestcv.resume/theme etc.; final localStorage exactly ["honestcv.clientId","honestcv.qa"]; light theme. Screenshots r250_*.png; results appended below.

## Results (executed on production, CDP; recording service down — attempted once)
Oracle: `npx tsx --tsconfig tsconfig.app.json` against src/lib/{ats,interviewAnalysis}.ts in this checkout (temp script, removed after run).
Fixture JD kws (13): python senior developer build data pipelines matters kubernetes daily terraform modules graphql apis; high-priority set (7): python senior developer terraform modules graphql apis.
- Z0 bundles index-ChprzR2u.js / Builder-F4Ymczjq.js live; interview dialog + #practice-answer present — PASS
- Z1 tiered lines: counter "Job keywords used: 9/13" (no "try working in" suffix); amber "High priority: python, terraform, graphql" with classes text-xs text-amber-700 dark:text-amber-400; "Also mentioned: matters"; equals oracle missing∩panel-high; panel High priority (7) tier cross-checked — PASS
- Z2a all-HP-covered: "Job keywords used: 7/13 — try working in: build, data, pipelines, matters, kubernetes" (old style, no amber) — PASS
- Z2b everything covered: "Job keywords used: 13/13", no suggestion lines — PASS
- Z2c empty JD: no keyword row (score-only card) — PASS
- Z2d 7 HP missing: "High priority: rust, golang, kotlin, swift, scala" (capped at 5), correctly no "Also mentioned" (missing==hpm) — PASS
- Z3 scores bit-identical to oracle/hand formula: Z1 91 (25+30+21+15), Z2a 73, Z2b 100, Z2d 62, Z4 87 — PASS
- Z4 delivery regression (timed 31s): Pace 124 wpm ideal; Speaking time 26% under; Quick fillers "i think/you know/basically" ×1 each 5.8/min; Filler sounds "um" ×1 1.9/min good; Tone clarity/confidence/enthusiasm all good; STAR ✓✓✓ — all equal to oracle at 31s — PASS
- Z5 375×812 scrollWidth 375; dark amber line pixel contrast 9.31:1; light amber: pixel-percentile 4.32:1 (antialiasing underestimate), exact computed colors rgb(187,77,0) on rgb(244,247,251) = 4.68:1 ≥4.5 — PASS
- Z6 __aiReqs [] (only baseline GET /api/ai/quota); final localStorage exactly ["honestcv.clientId","honestcv.qa"] (honestcv.resumeHistory auto-created during editing, removed); light theme — DONE

Note (setup): writing jobDescription straight into localStorage before load did NOT seed Builder state (keyword row absent, score 100) — pasting into the visible #jd textarea works; use the UI path.
Screenshots: /home/ubuntu/screenshots/r250_z1_tiered.png, r250_z2a_fallback.png, r250_z2b_full.png, r250_z2d_cap.png, r250_z4_delivery.png, r250_375_card.png, r250_dark_card.png (+r250_dark_amber_crop.png), r250_light_card.png (+r250_light_amber_crop.png), r250_cleanup_final.png
