# QA — R284 Suggest-a-bullet pair on Projects/Involvement (prod cv.zalize.com, expect index-CsNxhC7I.js / Builder-HFP1XQRP.js)

Code-traced: Builder.tsx suggestTargetFor 1316–1393 — proj: role=p.name, company=p.org??'',
section:'project', notReady "Add a project name or organization first — the bullet is drafted for
that project."; inv: role, company=organization, section:'involvement', notReady "Add a role or
organization first — the bullet is drafted for that involvement."; exp target has NO section key.
runSuggestBullet 1412–1421 POSTs /api/ai/suggest-bullet {role,company,companyInfo?,bullets,
resumeText,variant?,language?,section?}; on success "Suggested bullet" dialog (7310–7371) with
Apply to entry / Regenerate / Cancel; Apply appends first line to description via '\n' join.
Buttons rendered before the R283 rewrite pair (order per entry: Suggest a bullet, …with key
numbers, AI rewrite bullets, …with key numbers).

Harness: /home/ubuntu/qa/r283_lib.py buffered CDP Fetch interception on `*api/ai/suggest-bullet*`;
Fetch.failRequest every request except the one deliberate Fetch.fulfillRequest (S5). Zero live AI.

## S1 Project suggest payloads (intercepted, aborted)
Project name "Widget Tool", org "Acme Labs", description 2 lines. Row order: exactly
[Suggest a bullet, …with key numbers, AI rewrite bullets, …with key numbers]. Click plain suggest →
captured body has role:"Widget Tool", company:"Acme Labs", section:"project", bullets array of the
2 lines, NO variant key; aborted. Click key-numbers suggest → same + variant:"key-numbers"; aborted.
## S2 Involvement suggest payloads
Involvement role "Volunteer Lead" / organization "Code Club": plain body section:"involvement",
role/company match, no variant; key-numbers body adds variant:"key-numbers"; aborted.
## S3 disabled reasons
Blank project name AND org → both suggest buttons disabled with title exactly "Add a project name
or organization first — the bullet is drafted for that project."; rewrite pair keeps its own
"Write a rough bullet first…" reason only when description empty (with description non-empty,
rewrite stays enabled while suggest disabled). Involvement: blank role+organization → suggest pair
title "Add a role or organization first — the bullet is drafted for that involvement." Screenshots.
## S4 Experience regression
Click experience "Suggest a bullet" (intercepted, aborted): body keys exactly
{role,company,companyInfo?,bullets,resumeText,language} — NO section, NO variant; values match the
seeded entry.
## S5 Apply path via Fetch.fulfillRequest (no LLM)
Click project plain suggest; fulfill the paused request with 200 JSON
{"text":"Tested [add %] bullet.","freeRemaining":42}. Expect: "Suggested bullet" dialog opens with
textarea value "Tested [add %] bullet."; free-uses counter shows 42; click "Apply to entry" →
project description becomes previous lines + "\nTested [add %] bullet."; dialog closes. Screenshot
dialog + applied description.
## S6 mobile 375px
375x812: project row's 4 buttons stack/wrap, scrollWidth==375; screenshot.
## S7 (re-verify, bundles index-N_vi6K7U.js / Builder-DUo1y6aS.js) shared suggest reasons
Seed fixture with blank identity fields per section (exp role+company blank but a bullet present;
proj name+org blank with description; inv role+organization blank with description). For each
section, BOTH "Suggest a bullet" and its "…with key numbers" are disabled with title exactly:
exp → "Add a job title or company first — the bullet is drafted for that role."
proj → "Add a project name or organization first — the bullet is drafted for that project."
inv → "Add a role or organization first — the bullet is drafted for that involvement."
(pre-fix the key-numbers buttons showed "0 free AI uses left"). No AI clicks. Screenshots
r284b_*.png. Cache-bust if the old index.html is served.

## Safety/cleanup
Every suggest-bullet request either failRequest'd or the single fulfillRequest (no request reaches
the worker LLM); localStorage exactly ["honestcv.clientId","honestcv.qa"]; empty html class;
screenshots /home/ubuntu/screenshots/r284_*.png.
