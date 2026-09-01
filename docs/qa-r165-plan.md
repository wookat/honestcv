# R165 QA plan — pre-click "not ready" affordance on AI buttons (PR #380, bundles index-ByV7dU0z.js / Builder-BUU3GTK1.js)

Code evidence (commit 54fecd3, src/pages/Builder.tsx):
- aiButton(tag, label, onClick, notReady?: string|boolean): disabled when Boolean(notReady); title = notReady string (takes precedence over quota title); helper `<p class="text-muted-foreground w-full text-xs">{notReady}</p>` rendered below when string; red aiError suppressed while notReady.
- Wiring: exp Suggest a bullet → `!role && !company && 'Add a job title or company first — the bullet is drafted for that role.'`; "…with key numbers" → boolean only (disabled, no helper text); AI rewrite bullets → `!bullets.some(trim) && 'Write a rough bullet first — the AI rewrites your draft, it never invents experience.'`; Summary Draft from my resume → `!resumeHasContent && 'Add some experience or skills first — the draft is written only from your resume.'`; AI clean up skills → `!skills.trim() && 'Add some skills first — the AI cleans up your list, it never invents skills.'`; AI suggest related skills unchanged (never notReady).
- resumeHasContent = any exp role/bullet, or skills text, or education degree/school.

## K1 Bundles
Cache-busted fresh load → exactly index-ByV7dU0z.js + Builder-BUU3GTK1.js; baseline storage clean.

## K2 Empty resume + empty experience entry (1440) — primary
Seed fully empty resume (no role/skills/summary/education), add one empty Experience entry via UI ("Add experience"/equivalent). PASS iff:
- "Suggest a bullet", "…with key numbers", "AI rewrite bullets" all have `disabled` attr;
- Muted (not red) helper texts visible: the job-title reason under suggest, the rough-bullet reason under rewrite; computed color = muted-foreground (not destructive red);
- title attr of Suggest a bullet = the reason string; key-numbers has no helper text of its own.
Then type a job title into the role input → suggest + key-numbers enable, job-title reason disappears (rewrite stays disabled). Type a bullet → rewrite enables, its reason disappears.

## K3 Skills section
Skills empty: "AI clean up skills" disabled with muted reason "Add some skills first — …". "AI suggest related skills" ENABLED and clicking opens the "Explore skills" dialog (R164 regression; close it). Type "React" into skills → clean-up enables, reason gone.

## K4 Summary
Empty resume: "Draft from my resume" disabled with muted reason "Add some experience or skills first — …". After adding skill (K3), button enables; clicking opens R163 "Draft my summary" dialog (close it, no AI call).

## K5 Enabled end-to-end regression
With role "Frontend Engineer" set (K2), click "Suggest a bullet" → real AI call appends a non-empty bullet to that entry's bullets textarea.

## K6 Mobile 375
Empty entry state: helper texts wrap within viewport, `document.documentElement.scrollWidth ≤ 375`; disabled buttons keep h-10 (~40px) height (measure boundingRect height ≈40). Screenshot.

Cleanup: restore localStorage to exactly ["honestcv.clientId","honestcv.qa"]; fresh desktop tab innerWidth 1600. Quota badge untested by design (freeRemaining null for QA clients). No share/payment/export/deletion; one AI call allowed (K5).
