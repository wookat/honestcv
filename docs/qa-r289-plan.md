# QA — R289 custom title in summary position picker (prod cv.zalize.com, expect index-iuaBfS20.js / Builder-B1zgysvx.js)

Code-traced: summaryDraftSetup + summaryPositionOptions (Builder.tsx 1452–1470); open logic sets
`custom: !summaryPositionOptions.includes(aiTargetRole(resume))` (2415); dialog Position highlight
(7449–7499): select id `summary-draft-position` with options + sentinel `__custom__` label
"Type a different title…" (7469); custom mode renders Input (same id) + link button
"Pick a role from my resume instead" (7481–7497, falls back to options[0] if position not in
options); submit "Write 3 drafts" → runSummaryDraft (1494–1535) POST /api/ai/summary-draft with
`role: position.trim() || aiTargetRole(resume)` (1507); picker adjust reopens with
`custom: !options.includes(position)` (1520–1526). aiTargetRole (resume.ts 327–335) appends
"(Mid level)" etc.

Fixture: targetRole "Engineer", experienceLevel mid (→ aiTargetRole "Engineer (Mid level)"),
experience roles "Frontend Engineer"/"DevOps Engineer", skills, empty summary.
All /api/ai/* intercepted; fulfill summary-draft with fake 3-draft JSON; zero LLM calls.

## S1 Opens in custom mode with exact aiTargetRole
Summary section → "Draft from my resume" → dialog shows an INPUT (not select) with value exactly
"Engineer (Mid level)" plus link "Pick a role from my resume instead". Screenshot.
## S2 Switch to select, pick experience role, payload
Click the link → select#summary-draft-position appears; options exactly
["Engineer","Frontend Engineer","DevOps Engineer","Type a different title…(__custom__)"];
(prefill not in options → falls to options[0] "Engineer"). Select "DevOps Engineer", pick 1 skill,
Write 3 drafts → intercepted POST /api/ai/summary-draft payload role === "DevOps Engineer";
fulfill {"texts":["A.","B.","C."],"freeRemaining":42} → "Pick a summary" picker opens. Screenshot.
## S3 Adjust role & skills reopens in select mode
Click "Adjust role & skills" in picker → dialog reopens with SELECT (not input) whose value is
"DevOps Engineer" and the same picked skill chip pressed. Screenshot.
## S4 Sentinel → custom typed title
Choose "Type a different title…" in the select → Input appears prefilled "DevOps Engineer";
clear + type "Product Manager"; submit → intercepted payload role === "Product Manager"; fulfill.
Screenshot.
## S5 Blank custom input fallback
Adjust again → switch to custom (input), clear to "" and submit → intercepted payload role ===
"Engineer (Mid level)" (aiTargetRole fallback); fulfill/fail resolved pre-network.
## S6 Regression: no roles at all
Seed resume with no targetRole and no experience roles (skills only, so resumeHasContent true) →
open dialog: plain Input (empty prefill = aiTargetRole "" → custom), and NO
"Pick a role from my resume instead" link (options empty). Screenshot.
## S7 Mobile
375×812 with the dialog open (select mode): documentElement.scrollWidth == 375, controls in
viewport. Screenshot.
## Cleanup
All paused requests resolved pre-network; remove honestcv.resume/resumeHistory (+assistantChat if
created); baseline exactly ["honestcv.clientId","honestcv.qa"]; empty html class.
Screenshots /home/ubuntu/screenshots/r289_*.png.
