# R252 QA plan — assistant tailoring status (greeting card + chat strip)

Code evidence: src/components/AssistantPanel.tsx:161 `report = matchReport(resumeToPlainText(resume), jobDescription)` (re-derived every render — live); :301–324 greeting block (turns.length===0): bg-muted card "Your resume matches N% of the target job's keywords (X of Y)." + one of: amber `text-amber-800` "High priority to work in: <first 3 HP missing>" / muted "Still missing: <first 3 missing>" / emerald `text-emerald-700 dark:text-emerald-400` "All job keywords covered — nice tailoring."; :417–429 status strip when turns.length>0: "Target job: N% keyword match" + " · high priority: <first 2>" in `text-amber-800`; renders nothing when report null (no JD keywords or empty draft). Panel opens via Builder ghost button title "Resume assistant — chat about your draft and job search" (Builder.tsx:1617–1624) or `/builder?assistant=1` (1086–1096); panel receives `shown` resume + `resume.jobDescription` (6658–6663). Chat persisted at `honestcv.assistantChat` (:22, loadChat :65–68 accepts {role,content,action,applied,jobsQuery}); Apply (:224–229) calls onApply → Builder writes summary. Bundles: index-irIVdJVC.js / Builder-D69cCmYB.js.

Method: production via CDP; fixtures: R251 oracle draft resume (jane doe, summary with python/django/postgresql/docker/data pipelines/pytest) + R251 jd1 pasted into the visible `#jd` Target-job textarea (Builder ignores raw-seeded jobDescription — UI paste required). Oracle values from /home/ubuntu/qa/r251_oracle.json jd1_draft: pct 41, covered 7 of 17, HP missing [senior,kubernetes,terraform,graphql,apis,value,redis,kafka,matters], other missing [build]. Zero /api/ai/* completions (Find jobs + seeded turns are local).

## B0 Bundles
index-irIVdJVC.js + Builder-D69cCmYB.js live on /builder.

## B1 Greeting block (empty chat)
Seed draft, paste jd1 into #jd, open assistant via the header button. Assert greeting card shows exactly "Your resume matches 41% of the target job's keywords (7 of 17)." and amber line "High priority to work in: senior, kubernetes, terraform" (first 3, class text-amber-800, no dark: override); 41% equals the Target job panel % shown in Builder. Screenshot.

## B2 Live update
With the panel open, append " Terraform and Kubernetes." to the summary textarea via the Builder UI. Oracle: covered 9/17 → 53%, HP missing first 3 → senior, graphql, apis. Assert card updates without reopening: "matches 53% ... (9 of 17)" and "High priority to work in: senior, graphql, apis". Screenshot.

## B3 Strip with chat turns + Apply + regression
Seed honestcv.assistantChat with [user turn, assistant turn {content, action:{type:'summary', value:'<draft summary + valve/redis/kafka/matters/build keywords covering the rest except a couple>'}}] and reload with panel open. Assert strip above quick-task chips: "Target job: N% keyword match · high priority: <first 2>" (amber span text-amber-800). Click "Apply to summary" → summary changes in editor, strip % updates live to oracle value; button becomes applied state. "Show in editor" jumps to summary (regression). Click Find matching jobs quick action → local reply + "Search jobs …" link, zero /api/ai/* calls, strip persists. Clear chat (Trash2, title "Clear chat") → greeting card returns with current (post-apply) values. Screenshots.

## B4 Absence + all-covered
(a) Clear #jd (empty JD) → neither greeting block nor strip renders (greeting shows only ATS block; assert no "Your resume matches" text). (b) Empty draft (remove honestcv.resume, reload with jd pasted—new empty draft) → no block. (c) All-covered: paste jd4 (fully covered by draft) → emerald "All job keywords covered — nice tailoring." with class text-emerald-700 dark:text-emerald-400, no keyword list. Screenshots.

## B5 375px + dark
375×812 with panel open + greeting block: document.documentElement.scrollWidth === 375. Dark via UI toggle: rendered-pixel contrast of the amber "High priority to work in:" line ≥4.5:1 (inverted palette: text-amber-800 computes light oklch(.88 .11 88)); emerald line ≥4.5:1 (check in all-covered state); light theme amber contrast too. Screenshots + crops.

## B6 Zero AI + cleanup
__aiReqs [] at each instrumented stage (only GET /api/ai/quota baseline). Remove honestcv.resume/resumeHistory/assistantChat/theme; final localStorage exactly ["honestcv.clientId","honestcv.qa"]; light theme. Results appended below.

## Results (executed against production, bundles index-irIVdJVC.js / Builder-D69cCmYB.js)
- B0 bundles live: index-irIVdJVC.js entry + Builder-D69cCmYB.js chunk — passed
- B1 greeting card (draft + jd1, JD pasted via #jd UI): "Your resume matches 41% of the target job's keywords (7 of 17)." + amber (class `mt-1 text-xs text-amber-800`) "High priority to work in: senior, kubernetes, terraform" — oracle-exact (first 3 of 9 HP missing, order preserved) — passed
- B2 live update: typed " Terraform and Kubernetes." into the summary textarea with the panel open → card updated in place to "53% … (9 of 17)" + "High priority to work in: senior, graphql, apis" — oracle-exact — passed
- B3 strip (seeded local chat, no AI): "Target job: 53% keyword match · high priority: senior, graphql" (first 2, amber span) — passed. "Apply to summary" on an injected summary proposal → resume updated (localStorage byte-equal to fixture), strip live-updated to "Target job: 94% keyword match · high priority: value", button replaced by "Applied to your resume" (verified in a second seeded run) — passed. "Show in editor" button present/clickable; local "Find matching jobs" chip appended turns + "Search jobs →" link to /jobs with strip persisting; Clear chat → greeting card with post-apply values "94% (16 of 17), HP: value" — passed
- Cross-check: Builder ATS panel "Keywords 94" === report.pct 94 (same-oracle) — passed
- B4 absence: no JD → no card, no strip (with seeded turns); stopword-only JD → no card; empty draft + JD → no card — passed. All-covered (jd4): "100% (8 of 8)" + emerald "All job keywords covered — nice tailoring." (`text-emerald-700 dark:text-emerald-400`); strip "Target job: 100% keyword match" with no amber segment — passed
- B5 375×812: scrollWidth 375 in both greeting and strip states; ATS score card + tailoring card both render — passed
- B5 dark (UI theme cycle): amber greeting line computed oklch(0.88 .11 88) (light in inverted palette), rendered-pixel contrast 10.87:1; strip amber 13.57:1; emerald line oklch(0.765 .177 163) 8.04:1 — all ≥4.5 — passed. Light: amber 6.31:1, emerald 4.78:1 — passed
- B6 quick-task chips ("Improve my ATS score/Draft my summary/Suggest skills/Find matching jobs") render in greeting and as the chip row immediately after the strip (strip.nextElementSibling === chip row) — presence verified; NOT clicked (would fire a real /api/ai completion) — passed with that scope note
- B7 zero /api/ai/* completions at every instrumented stage (__aiReqs [] throughout; baseline GET /api/ai/quota only); cleanup: final localStorage exactly ["honestcv.clientId","honestcv.qa"], light theme — done
- Note: theme toggle button title is the CURRENT pref ("Light theme"/"Dark theme"/"System theme"), cycling light→dark→system.
