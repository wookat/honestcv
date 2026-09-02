# QA — R294 production (cv.zalize.com, expected index-DcdNsNPm.js / Builder-B7PQbTUH.js)

Delta: "Complete a half-written bullet". guidance.ts:566 unfinishedBulletLine (last filled
line 1–80 chars, no terminal .!? → its filtered index). Builder.tsx 2911/3736/4113: in
Experience/Projects/Involvement, button `Complete line ${li+1}` after the key-numbers
suggest button, calling runSuggestBullet(section,id,undefined,{draft,lineIndex}). POST
/api/ai/suggest-bullet gains `draft` (partial line), bullets EXCLUDE the draft line, no
variant. Dialog: title "Completed bullet", primary "Replace line", applies in-place
replacement. Regenerate resends {draft,lineIndex} → byte-identical payload. Not-ready
reasons: exp "Add a job title or company first…", proj "Add a project name or
organization first…", inv "Add a role or organization first…".

Method: CDP port 29229, Fetch armed on *api/ai/* all session, fulfill with fake
{"text":"…","freeRemaining":N}. Fixture seeded via localStorage; UI interactions real
(click-verify-retry after scrollIntoView settle).

## B1 Experience complete flow (primary)
Seed exp e1 (role+company set) bullets ["Did a thing.", "Improved deploy"] → button
"Complete line 2" visible after "…with key numbers". Click → intercepted POST
/api/ai/suggest-bullet payload: draft=="Improved deploy", bullets==["Did a thing."],
section=="experience"(report actual), NO variant key. Fulfill fake → dialog title
"Completed bullet", primary button "Replace line". Click Replace line → bullets textarea
line 2 == fake text, line 1 == "Did a thing." unchanged, order preserved,
honestcv.resume e1.bullets updated. Screenshots.

## B2 Regenerate byte-identity
Reopen (or before applying): click Regenerate in the dialog → second intercepted payload
string-equal to first (same draft, same excluded bullets).

## B3 No-draft regression
Change last bullet to end with "." → "Complete line" button absent; click plain "Suggest a
bullet" and "…with key numbers" → both payloads contain NO "draft" key.

## B4 Projects + Involvement
Seed project (name set) description ["Shipped v1.", "Cut costs"] and involvement
(role+org) similarly → "Complete line 2" in each; payload section=="project"/"involvement"
and draft correct; Replace line replaces in the description textarea in place.

## B5 Not-ready disabled state
Entry with empty role+company (exp) → Complete button disabled, title/reason == "Add a job
title or company first — the bullet is drafted for that role." (spot-check one section).

## B6 375px
375×812: the aiButton row wraps, documentElement.scrollWidth <= 375, screenshot with
"Complete line N" visible.

## Cleanup (per lead's explicit R294 instruction — NOTE inverts prior baseline)
Remove honestcv.resume, resumeHistory, resumeVersions, templateRecents, clientId, qa,
assistantChat; PRESERVE honestcv.subscribed / honestcv.shared. Zero /api/ai/* to network;
all paused requests fulfilled. Empty html class. Flag baseline inversion in report.

## Results (production, bundles index-DcdNsNPm.js / Builder-B7PQbTUH.js confirmed)
- B1 PASS: "Complete line 2" after "…with key numbers"; POST /api/ai/suggest-bullet payload
  {bullets:["Did a thing."], company, draft:"Improved deploy", resumeText, role} — draft correct,
  draft line EXCLUDED from bullets, no variant. Dialog "Completed bullet" / "Replace line";
  replace put the fake text in line 2, line 1 untouched (verified in honestcv.resume).
  Note: experience payload has NO `section` key (only project/involvement send section) —
  matches omit-empty-optionals baseline; language/targetRole/jobDescription/companyInfo also
  absent for this fixture.
- B2 PASS: Regenerate payload byte-identical (371==371, string-equal).
- B3 PASS: after line 2 ends with ".", Complete button gone for e1 (only e2's disabled one
  remains); plain Suggest keys [bullets,company,resumeText,role] no draft; key-numbers adds
  variant:"key-numbers", no draft; dialog stays "Suggested bullet"/"Apply to entry".
- B4 PASS: project payload section:"project", draft:"Cut costs", bullets:["Shipped v1."];
  involvement section:"involvement", draft:"Grew program", bullets:["Ran sessions."];
  Replace line updated the description strings in place (first line untouched).
  Harness notes: project/involvement description is a newline-joined STRING (array fixture is
  coerced to ""); Projects panel was collapsed and needed the "Projects (optional)" header click.
- B5 PASS: empty role+company exp entry → button disabled, title exactly "Add a job title or
  company first — the bullet is drafted for that role."
- B6 PASS: 375×812 scrollWidth=375; "Complete line 2" wraps onto its own row (y=386 with AI
  rewrite bullets, below …with key numbers at 338), right edge 177<375.
- Quota note: real GET /api/ai/quota returned freeRemaining 0 for this clientId; mocked the
  quota GET pre-network with {"freeRemaining":42} so buttons enabled — zero real AI POSTs all
  session (every /api/ai/* paused and fulfilled/mocked).
- Cleanup PER LEAD'S EXPLICIT R294 INSTRUCTION (inverts prior baseline): removed resume,
  resumeHistory, resumeVersions, templateRecents, clientId, qa, assistantChat; preserved
  subscribed+shared. Final keys exactly ["honestcv.shared","honestcv.subscribed"]; empty html class.
