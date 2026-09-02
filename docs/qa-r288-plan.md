# QA — R288 "Draft another option" in KeywordBulletDialog (prod cv.zalize.com, expect index-DDaizxrl.js / Builder-BFHSf0Hc.js)

Code-traced: triage card in Target job panel renders when `ats.missing.length > 0`
(Builder.tsx 6727–6745), button "Yes — draft a bullet" → `setKwBulletFor(ats.missing[0])`
→ `KeywordBulletDialog` (10000–10127). run() (10031–10049) POSTs via `aiKeywordBullet`
{keyword, resumeText, jobDescription, role, language}; only setText on success. Drafted-state
row (10101–10119, flex flex-wrap gap-2): "Add bullet" (disabled while busy/empty), NEW outline
"Draft another option" (disabled while busy, "Drafting…" + spinner when busy, re-invokes run()),
"Discard" now variant=ghost. After insert → row replaced by "Added to your resume." (10098–10099).
Entry select id `kwBulletExp`, preselects best match.

Fixture: resume with 2 experience entries (so select + "best match" render), JD containing a
keyword missing from the resume (e.g. "Kubernetes") so triage shows it as `missing[0]`.
Fetch interception on `*api/ai/*` armed the whole round; every paused request fulfilled/failed
pre-network; zero LLM calls.

## K1 Draft + three-button row
Open Target job panel → triage card shows missing keyword → click "Yes — draft a bullet" →
dialog "Draft a bullet for “kubernetes”" → click "Draft the bullet" → intercept POST
/api/ai/keyword-bullet, record payload P1, fulfill 200 `{"text":"Deployed services on Kubernetes [add scale].","freeRemaining":42}`.
Assert: textarea shows the mock text; row shows exactly Add bullet / Draft another option
(outline) / Discard (ghost); free counter shows 42. Screenshot.
## K2 Regenerate byte-identical + replace in place
Note select value; click "Draft another option" → while paused, screenshot busy state
("Drafting…" + disabled Add bullet); assert P2 postData string-equal to P1; fulfill with
`{"text":"Automated Kubernetes rollouts [add %].","freeRemaining":41}`. Assert textarea replaced
with new text in still-open dialog, select value unchanged. Screenshot.
## K3 Failure path
Click regenerate again → assert P3 == P1 → Fetch.failRequest. Assert inline destructive error
appears, textarea still shows the K2 text (editable — type an edit), Add bullet enabled.
Screenshot.
## K4 Insert after regenerate
Click "Add bullet": assert the current textarea text is appended to the selected experience's
bullets (verify honestcv.resume), button row disappears and "Added to your resume." shows.
Screenshot.
## K5 Manual edit then regenerate
Reopen dialog, draft (mock), edit textarea manually, regenerate (P == P1 modulo nothing — payload
uses resume state, unchanged), fulfill → edited text replaced by fresh mock. (expected behavior)
## K6 Mobile
375×812 with the drafted dialog open: buttons wrap, document scrollWidth == 375. Screenshot.
## Cleanup
All paused requests resolved; remove honestcv.resume/resumeHistory (assistantChat untouched this
round unless created); baseline exactly ["honestcv.clientId","honestcv.qa"]; empty html class.
Screenshots /home/ubuntu/screenshots/r288_*.png.
