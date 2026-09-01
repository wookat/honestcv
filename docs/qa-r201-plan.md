# R201 QA plan — instant local "Practice score" in Interview Prep practice area (index-DjJBaYbg.js)

Code evidence: src/lib/interviewAnalysis.ts (analyzeAnswer: length bands <40/40–250/>250, CONTEXT/ACTION/RESULT regexes, FILLER_PHRASES, weHeavy = we>i && we≥3, keyword coverage via extractKeywords minus ignoredKeywords, score = lengthPts+starPts(10×3)+kwPts(30)+deliveryPts(15) or renormalized ×100/70 without JD); Builder.tsx L6321-6330 header "Interview prep" button (freeMode/qa unlock), L7562-7565 useMemo gate `answer words ≥10`, L7998-8004 textarea `#practice-answer`, L8006-8060 card: "Practice score: NN/100", "Instant · local — no AI used", length line emerald/amber (`text-emerald-700 dark:text-emerald-400` vs amber), 3 STAR chips `✓/·` emerald-100/amber-100 (dark -950/-300) with title hints on misses, "Job keywords used: n/m — try working in: …" (only when analysis.keywords), filler line "Hedging words to cut: …" / we-heavy sentence.

## T1 Bundle + reach
Entry index-DjJBaYbg.js; /builder loads Builder-KmFyQgLm.js. Load example resume; click header "Interview prep" → dialog titled "Interview Prep Brief"; scroll to "Practice an answer"; no brief generation needed.

## T2 Weak answer (no JD yet — clear jobDescription first)
Type "I think we kind of did some stuff with the team maybe last year" (13 words) into #practice-answer. Assert card appears with: words line "13 words — Too short…" in amber; chips: Situation/context ✓? (contains "the team"? — CONTEXT_RE needs specific phrases; "last year" matches `last (?:year…)` → context ✓ expected), Action amber `·` (no "I <verb>"), Result amber `·`; hovering/reading title attr present on amber chips; filler line contains "kind of, i think, maybe" (order per FILLER_PHRASES: kind of, i think, maybe) + we-heavy NOT shown (we=1). Expected score (no JD): lengthPts=round(13/40*15)=5, star=10, delivery=(fillers 3→4)+(7)=11 → round(26/70*100)=37. Assert exact rendered score 37/100. Screenshot.

## T3 Strong answer + JD keywords
Set Target job JD via UI (Target job panel textarea) with keyword-bearing text (e.g. React, TypeScript, Kubernetes, GraphQL, CI/CD terms). Then answer: ~60-word STAR answer starting "When our deployment pipeline kept failing last year, I led the migration … built … reduced build time by 40% … React TypeScript Kubernetes…". Assert: all 3 chips emerald ✓; length line emerald "Good length for a spoken answer."; keyword line "Job keywords used: n/m — try working in: …" with n≥3 and n larger than for the weak answer; score numerically ≥85 and > weak score; no filler line. Verify zero /api/ai/* non-quota requests via performance entries. Screenshot.

## T4 JD empty → keyword line hidden
Clear jobDescription; same strong answer: keyword line absent, card still renders, score renormalized (expect round((25+30+15)/70*100)=100). Screenshot optional.

## T5 Gate
9-word answer → no card ("Practice score" absent from DOM); clear answer → card absent.

## T6 AI buttons untouched
"Get AI feedback" and "Suggest questions" buttons present and enabled (not consumed); do NOT click-to-generate.

## T7 Mobile + dark
375px emulation with dialog open: dialog content no horizontal overflow (scrollWidth of dialog ≤ clientWidth; document scrollWidth 375). Dark mode: card visible, chip computed colors use dark variants (emerald-950 bg / emerald-300 text etc.). Screenshots.

## T8 Regression smoke
R200 Sidebar preview renders side labels (absolute h3 w74/padding 86); R199: 375 builder scrollWidth 375, tagline hidden; builder main flow (typing updates preview) OK.

## T9 Cleanup
Zero AI generation calls; final localStorage exactly ["honestcv.clientId","honestcv.qa"] (purge resume/resumeHistory/templateRecents/theme etc.).

## Results (executed on production, index-DjJBaYbg.js / Builder-KmFyQgLm.js)
- T1 PASS: bundles confirmed; "Interview prep" header button opens "Interview Prep Brief" dialog; #practice-answer present without generating a brief.
- T2 PASS: weak answer (14 words) → "Practice score: 31/100" — matches formula exactly (length 5 + context 10 + delivery 7, ×100/70); "Instant · local — no AI used"; amber length line "14 words — Too short — aim for 60–200 words…"; chips ✓ Situation/context (matched "last year"), · Action amber (title "say what you did — “I led / built / fixed…”"), · Result amber; filler line "Hedging words to cut: kind of, i think, maybe, stuff." (r201_weak_answer.png).
- T3 PASS: JD set via #jd textarea; 70-word STAR answer → "Practice score: 94/100", all 3 chips emerald ✓, emerald "Good length…", "Job keywords used: 11/14 — try working in: senior, frontend, engineer", no filler line; zero non-quota /api/ai/ requests (r201_strong_answer.png).
- T4 PASS: JD cleared → keyword line hidden, score renormalized to exactly 100/100 (70/70), card still works.
- T5 PASS: 9-word answer → no card; empty answer → no card.
- T6 PASS: "Get AI feedback" and "Suggest questions" buttons present and enabled (not clicked — no quota spent).
- T7 mobile PASS: 375px with dialog open: document scrollWidth 375, dialog scrollWidth === clientWidth (373), 0 elements past viewport (r201_mobile_375.png).
- T7 dark **FAIL — P3**: STAR chips are low-contrast in dark mode (~2.3:1). Root cause: chips use `dark:text-emerald-300`/`dark:text-amber-300` (Builder.tsx L8036-8037, new in R201), but the app's inverted dark palette (src/index.css L148 `--color-amber-300: oklch(0.48 0.1 80)`, L156 `--color-emerald-300: oklch(0.47 0.09 165)`) remaps -300 tokens to ~47% lightness while `dark:bg-*-950` stays at 26-28% — measured text pixels emerald (23,106,78) on (0,44,34) and amber (123,86,0) on (70,25,1) ≈ 2.26:1 / 2.35:1 (WCAG AA needs 4.5:1). The length/filler lines use `dark:text-amber-400` (82.8% — not remapped) and are fine. Suggested fix: use dark:text-*-400 (or -700/-800, which the inverted palette maps light) on the chips. Evidence r201_dark_card.png, r201_dark_chips_zoom.png.
- T8 PASS (regression): Sidebar preview 4 absolute labels w74/padL86; typing name updates preview; 375 builder scrollWidth 375, tagline hidden (r201_regression_375_sidebar.png).
- T9 DONE: zero AI generation calls; final localStorage exactly ["honestcv.clientId","honestcv.qa"].
