# R256 QA plan — interview practice "Add to your resume" resume-gap line

Code evidence: src/pages/Builder.tsx:8020–8026 `resumeGaps = analysis.keywords.covered ∩ matchReport(resumeToPlainText(resume), resume.jobDescription).missing` (answer-covered order; analysis = analyzeAnswer(answer, jd, resume.ignoredKeywords) at :7993–7997, gated ≥10 words); :8609–8623 sky line `text-sky-700 dark:text-sky-400`: "Add to your resume: you used <slice(0,5) join ', '>[ +N more] in this answer, but <it's|they're> not on your resume yet. " + underline button "Open keyword targeting →" → onJumpToTarget (Builder.tsx:6631–6634: setToolOpen(null) + jumpToSection('target'); jumpToSection:972–978 sets mobilePane('edit')). Practice score line :8547–8549 "Practice score: N/100" (analyzeAnswer only — resume not an input). Dialog entry: /builder?doc=interview (:808–811). Bundles: index-V1tq4ZW7.js / Builder-DvKB25f5.js.

Method: production CDP; seed honestcv.resume (summary controls resume text; ignoredKeywords field); paste JD via visible #jd textarea (localStorage-only jobDescription doesn't hydrate); type answer into the dialog textarea; tsx oracle (npx tsx --tsconfig tsconfig.app.json) computing analyzeAnswer/matchReport/resumeGaps + score for the exact fixture strings. Zero /api/ai/* counter. Screenshots r256_*.

Fixtures:
- JD-A: names terraform, kubernetes, python, sql (+filler). Resume-A summary has python & sql but NOT terraform/kubernetes. Answer-A (≥10 words) uses terraform + kubernetes → expected gaps [terraform, kubernetes] (answer order), plural "they're".
- Answer-A1: uses only terraform → 1 gap, singular "it's".
- JD-B: ≥8 distinct keywords absent from Resume-B; Answer-B uses 7 of them → line shows first 5 + " +2 more".
- Exclusions on JD-A: (i) keyword on resume (python used in answer → NOT in line), (ii) JD keyword not in answer (not in line), (iii) ignoredKeywords:["kubernetes"] seeded → kubernetes drops from analysis.covered hence from line.

## F0 Bundles
index-V1tq4ZW7.js entry; Builder-DvKB25f5.js chunk on /builder.

## F1 Oracle byte-compare (plural)
Resume-A + JD-A, open /builder?doc=interview, type Answer-A → sky line textContent byte-equals oracle: `Add to your resume: you used terraform, kubernetes in this answer, but they're not on your resume yet. Open keyword targeting →` (order per oracle); line has class text-sky-700. Screenshot.

## F2 Exclusions
Same state: python (covered in answer AND on resume) absent from the line; JD-A keywords not used in the answer absent. Reload with ignoredKeywords:["kubernetes"] → line lists terraform only (singular form). Screenshot.

## F3 Singular + cap
Answer-A1 → "…you used terraform in this answer, but it's not on your resume yet." Resume-B+JD-B+Answer-B → exactly oracle first-5 + " +2 more". Screenshots.

## F4 Absence
(a) Clear JD (empty #jd) → analysis has no keywords → no sky line. (b) Resume containing all answer-used JD keywords → no gaps → no sky line while other analysis lines render. Screenshot.

## F5 Score invariance
With Answer-A + Resume-A: record "Practice score: N/100" (=== oracle analyzeAnswer score). Edit resume summary to include terraform+kubernetes (line must disappear) → score string byte-identical. Screenshot pair.

## F6 Jump button
Desktop: click "Open keyword targeting →" → dialog closes (no [role=dialog]), Target job section scrolled into view with ring highlight. 375×812: reopen dialog, retype, click → mobilePane switches to Edit (Target job panel visible), scrollWidth===375 before and after. Screenshots.

## F7 Regression
Same analysis card: "Practice score: N/100" + "Instant · local — no AI used", words/length line, 3 STAR chips, R250 tier lines ("High priority: …" / "Also mentioned: …" or "Job keywords used: n/m"), timer button ("Start 2-minute timer"/Timed: Ns), filler + tone lines if rendered per oracle. Cover letter + resignation tools still open via their buttons. Screenshot.

## F8 Contrast
Rendered-pixel (4× crop, 2/98 pct) of the sky line in light (text-sky-700) and dark (dark:text-sky-400) ≥4.5:1. Screenshots + crops.

## F9 Zero AI + cleanup
__aiReqs [] throughout (quota baseline allowed). Remove honestcv.resume/theme/etc.; final localStorage exactly ["honestcv.clientId","honestcv.qa"]; light theme. Results appended below.

## Results (executed on production, bundles index-V1tq4ZW7.js / Builder-DvKB25f5.js)
- F0 bundles live — passed
- F1 plural oracle byte-compare: "Add to your resume: you used terraform, kubernetes in this answer, but they're not on your resume yet. Open keyword targeting →" — passed on instrumented re-run (r256_f1b.py). First attempt showed extra gaps (python, sql, pipelines) caused by a stale-state race: the resume seed was written while the previous page's Builder instance was still mounted, and its unmount persistence overwrote the seeded summary. Re-run with reload-after-seed verification byte-matched; not a product defect.
- F2 exclusions: python (on resume) and unused JD keywords absent; ignoredKeywords:["kubernetes"] → terraform-only singular line, score 64 — passed
- F3 singular "it's" (Answer-A1, score 46) and cap "terraform, kubernetes, graphql, redis, kafka +2 more" (Answer-B, score 66) — passed
- F4 absence: empty JD → no line; Resume-FULL (all keywords) → no line while analysis card renders — passed
- F5 score invariance: "Practice score: 65/100" byte-identical with line (Resume-A) and without (Resume-FULL) — passed
- F6 desktop jump: dialog closed (no [role=dialog] node), #jd in viewport, target wrapper ring-2 ring-ring/50 highlight — passed. 375×812: scrollWidth 375 before/after, dialog closed, Edit pane with #jd visible — passed
- F7 regression: score + "Instant · local — no AI used", words line, STAR chips [✓ Situation ✓ Action · Result], R250 tier "High priority: hands-on, production", timer "Start 2-minute window" → "1:55 left…" → "Timed: 5s", pace + tone lines, Cover letter / Interview prep / Resignation letter buttons — passed
- F8 contrast (rendered-pixel 4× crop): light sky 5.45:1, dark 8.17:1 (oklch(0.746 .16 232.7)) — passed
- F9 zero AI (__aiReqs [] throughout); final localStorage ["honestcv.clientId","honestcv.qa"], light theme — done
