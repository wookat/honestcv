# R240 QA plan — Assistant "Find matching jobs" local quick task + /jobs?q= deep link

Code evidence: src/components/AssistantPanel.tsx — FIND_JOBS_LABEL/PROMPT :103–104; topSkills :107–115 (per line strip "Cat:" prefix, split commas, top 5); findJobsReply :118–135 (role = targetRole.trim() || first non-hidden experience role || ''; content with “role” quoted, skills/location signals, generic no-role message); findJobs :208–219 (local only, no fetch; busy guard); jobsQuery button render :332–337 (`Search jobs “<q>” →` Link to /jobs?q=enc or /jobs); persist loadChat keeps jobsQuery :68; chip row + empty-state buttons :314–316/:409–412 (disabled when busy). Builder.tsx: assistant opens via ghost icon button title "Resume assistant — chat about your draft and job search" :1617–1624 or ?assistant=1 :1086–1096. Jobs.tsx: seedQuery from ?q= :103–106, mount fetch uses seedQuery ?? draft targetRole :139–142. Bundles: index-CTDiQKXu.js / Builder-B7Pji0GV.js / Jobs-Bu8hMybj.js.

Method: network capture via performance resources + fetch-count wrapper asserting ZERO /api/ai/* generation calls during the quick task. Example resume fixture (Jordan Reyes) — set targetRole "Product Manager".

## N0 Bundles
index-CTDiQKXu.js + Builder-B7Pji0GV.js live on /builder; Jobs-Bu8hMybj.js on /jobs.

## N1 Primary flow with targetRole
targetRole "Product Manager"; open assistant (icon button); click "Find matching jobs" (empty state or chip). Expect: user turn exactly "Find job opportunities that match my resume."; assistant turn starts `Based on your resume, I'd search the job board for “Product Manager”.`, mentions top-5 example skills (React, TypeScript, Node.js, Python, PostgreSQL) and location (Austin, TX); outline button `Search jobs “Product Manager” →` with href /jobs?q=Product%20Manager; ZERO /api/ai requests fired by this action (fetch counter unchanged). Screenshot. Click button → lands on /jobs, search input value "Product Manager", results fetched for that query (request URL contains q/search=Product Manager per jobs API; at minimum input seeded + results header reflects search). Screenshot.

## N2 Fallbacks
Back in builder: clear targetRole → quick task → reply uses first visible experience role “Software Engineer”, button /jobs?q=Software%20Engineer. Then hide/remove role signals: set targetRole '', hide both experience entries (or temporarily clear roles) → generic reply "Your resume doesn’t name a target role yet…" + button `Search jobs →` href exactly /jobs. Screenshot. Restore entries.

## N3 Punctuation encoding
targetRole "Sr. PM / Growth" → button href /jobs?q=Sr.%20PM%20%2F%20Growth (encodeURIComponent: '/'→%2F, spaces %20). Assert exact href.

## N4 Persistence
Reload /builder, reopen assistant → Find-jobs turns still rendered with working button (jobsQuery persisted in honestcv.assistantChat). Assert localStorage honestcv.assistantChat last assistant turn has jobsQuery string.

## N5 Chips + busy
After first turn, chip row shows "Find matching jobs" chip (screenshot). Busy state: trigger an AI quick task (e.g. "Review my resume" — quota-exhausted clientId returns quota message, acceptable, still sets busy during flight) and immediately assert the Find-jobs chip is disabled while busy=true; after settle it re-enables. If flight too fast to catch, stub window.fetch for /api/ai/assistant with a delayed promise instead (zero real calls).

## N6 Regression
AI quick task from N5 doubles as regression: the 4 old quick tasks still send to /api/ai/assistant (payload/quota message observed — no quota burned if 402/limit). /jobs without ?q= → input seeds from draft targetRole as before. Jobs board search still works (type query, Search → results update). ATS unchanged by assistant usage.

## N7 375px + dark
375×812: assistant panel with Find-jobs card/button, no horizontal overflow (iw/sw 375). Dark: core-pixel contrast of outline `Search jobs …` button text ≥4.5:1. Screenshots.

## N8 Cleanup
localStorage exactly ["honestcv.clientId","honestcv.qa"], light theme, reload clears wrappers. Screenshots r240_*.png; recording attempted once (service down since R166) else CDP screenshots. Results appended below.

---

## Results (executed on production, recording service down — CDP screenshots)

- N0 PASS — index-CTDiQKXu.js + Builder-B7Pji0GV.js live on /builder; Jobs-Bu8hMybj.js loaded on /jobs.
- N1 PASS — targetRole "Product Manager": user turn exactly "Find job opportunities that match my resume."; assistant reply names “Product Manager”, skills (React, TypeScript, Node.js, Python, PostgreSQL), location (Austin, TX); button `Search jobs “Product Manager” →` href /jobs?q=Product%20Manager; window.__ai stayed [] (zero /api/ai/*). Click → /jobs?q=Product%20Manager, input "Product Manager", mount request /api/jobs/search?q=Product+Manager. Screens: r240_findjobs_pm.png, r240_jobs_seeded.png.
- N2 PASS — blank role → fallback “Software Engineer” (first visible experience), href /jobs?q=Software%20Engineer (r240_fallback_exp.png); both experiences hidden → generic "Your resume doesn’t name a target role yet…" + `Search jobs →` href /jobs, jobsQuery "" (r240_generic_hidden.png). Zero AI calls both.
- N3 PASS — "Sr. PM / Growth" → /jobs?q=Sr.%20PM%20%2F%20Growth (r240_punct.png).
- N4 PASS — after reload + reopen, all 4 job buttons re-render from persisted honestcv.assistantChat; jobsQuery values ['Product Manager','Software Engineer','','Sr. PM / Growth'] (r240_persist.png).
- N5 PASS — chip row shows all 5 tasks incl. "Find matching jobs" (r240_chiprow.png); during delayed-stub AI flight all 5 chips disabled=true incl. Find matching jobs (r240_busy_disabled.png); re-enabled after settle.
- N6 PASS (regression) — "Improve my ATS score" quick task POSTs /api/ai/assistant with turns/resumeText/role/scoreSummary/jobDescription (real 402 quota path shows "0 free AI rewrites left — resets within 30 days", zero quota burned; stubbed flight used for busy check) (r240_ai_regression.png); injected action turn renders "Apply to summary" + "Show in editor" cards (r240_apply_card.png); /jobs no ?q= seeds input+search from draft targetRole (q=Sr.+PM+%2F+Growth, r240_jobs_noq.png); manual search fired q=designer with 18 result cards + Save→Tracked (1) (r240_jobs_search.png, r240_jobs_tracked.png); ATS 99/100 before and after.
- N7 PASS — 375×812: iw/sw 375/375, all Search-jobs buttons right edge ≤266 (r240_375_panel.png); dark outline button core-pixel contrast 15.26:1 (r240_dark_button.png).
- N8 DONE — localStorage exactly ["honestcv.clientId","honestcv.qa"], light theme, overrides cleared by reload.
