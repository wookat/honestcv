# R206 QA plan — review dialog for AI bullet suggestions (index-lgpG70uy.js / Builder-IXtt1tLn.js)

Code evidence: Builder.tsx L2610-2623 trigger buttons "Suggest a bullet" / "…with key numbers" per experience entry (disabled unless role or company); runSuggestBullet L1219-1248 POSTs /api/ai/suggest-bullet (payload: role, company, companyInfo?, bullets[], resumeText, variant?, language) then sets bulletSuggest {expId, variant, text=first line} — no resume mutation; review dialog L6592-6657: title "Suggested bullet", Textarea aria-label "Suggested bullet text", "Apply to entry" (disabled when text empty; appends first line of edited text via setExp), "Regenerate" (re-calls runSuggestBullet with same variant), "Cancel" (setBulletSuggest(null)). api.ts L124 endpoint '/api/ai/suggest-bullet'.

## Z1 Bundles
Entry index-lgpG70uy.js; /builder Builder-IXtt1tLn.js. PASS iff exact.

## Z2 Mocked suggest → dialog, no mutation, Cancel
Example resume loaded; record bullets of first experience entry (from localStorage honestcv.resume). Intercept *suggest-bullet* (check c.events buffer!), click "Suggest a bullet", fulfill mock {"text":"- Mock suggested bullet R206.","freeRemaining":null}. PASS iff dialog "Suggested bullet" opens with textarea value "Mock suggested bullet R206." (leading "- " stripped), AND localStorage resume bullets unchanged while dialog open. Click Cancel → dialog closes, bullets in state + localStorage unchanged (no new bullet).

## Z3 Edit → Apply appends edited text; empty disables Apply
Re-trigger with mock. Set textarea to "EDITED bullet — QA R206\nsecond line ignored" via native setter+input. Click "Apply to entry" → entry's bullets gain exactly one new last bullet "EDITED bullet — QA R206" (first line only), dialog closes. Then re-trigger, clear textarea to "" → "Apply to entry" disabled=true (Regenerate/Cancel enabled).

## Z4 Regenerate re-requests same shape and replaces draft
In an open dialog (draft "Mock suggested bullet R206."), intercept and click Regenerate → new POST /api/ai/suggest-bullet captured; payload keys == first request's keys and variant matches; fulfill with {"text":"Second mock draft.",...} → textarea now "Second mock draft."; still no resume mutation.

## Z5 key-numbers variant goes through the dialog
Click "…with key numbers" with intercept: payload has variant:"key-numbers"; mock → same "Suggested bullet" dialog opens; Regenerate from it sends variant:"key-numbers" again (assert in Z4 style or separate capture).

## Z6 Real end-to-end (1 quota use)
No intercept: click "Suggest a bullet" on entry with role/company → real response opens dialog with non-empty draft; click "Apply to entry" → bullet appended to that entry (visible in edit list + localStorage). Screenshot.

## Z7 Viewports + dark
Dialog at 1440 (fits) and 375 (dialog width ≤375, doc scrollWidth==375, all 3 buttons boundingRect height ≥40); dark mode: description/textarea text pixel-contrast ≥4.5:1 peak, screenshot.

## Z8 Regression
R205 summary-draft dialog still opens with JD note when JD present (no call). Keyword bullet draft dialog (sparkles on a missing-keyword chip, from Target job score breakdown) still opens (close without generating). BulletIdeas variant selector (R186 "Bullet ideas") still opens/inserts locally.

## Z9 Cleanup
Exactly 1 real /api/ai/suggest-bullet call; localStorage exactly ["honestcv.clientId","honestcv.qa"]; light theme.

## Results (executed on production)
- Z1 bundles index-lgpG70uy.js / Builder-IXtt1tLn.js — PASS
- Z2 mocked suggest: payload keys [bullets,company,resumeText,role] (no variant), dialog "Suggested bullet" with "- " prefix stripped ("Mock suggested bullet R206."); bullets 3 unchanged while open; Cancel → dialog closed, bullets still 3 — PASS
- Z3 edit→Apply: textarea set to "EDITED bullet — QA R206\nsecond line ignored", Apply appended exactly "EDITED bullet — QA R206" (first line only, 3→4), dialog closed; empty textarea → Apply disabled=true, Regenerate/Cancel enabled — PASS
- Z4 Regenerate: new POST captured with identical payload keys, draft replaced by "Second mock draft.", no bullet added — PASS
- Z5 key-numbers: payload variant:"key-numbers", same review dialog; Regenerate resends variant:"key-numbers" — PASS
- Z6 real e2e (1 quota): real draft "Delivered customer-facing features in React and TypeScript serving 2M+ monthly users…", Apply → bullets 4→5, last bullet == draft (localStorage verified) — PASS
- Z7: 1440 dialog w512 fits; 375 dialog w375, sw==375, all 3 buttons 40px tall (36px desktop per sm:min-h-9); dark desc contrast 6.77:1, textarea text 13.87:1 — PASS
- Z8 regression: R205 "Draft my summary" dialog opens with JD note; keyword chip dialog "Draft a bullet for “kubernetes”" opens; R186 bullet starters expand + insert (5→6) — PASS
- Z9: exactly 1 real /api/ai/suggest-bullet call (10 others fulfilled locally via Fetch mock, never hit backend); zero other /api/ai calls; light theme; localStorage exactly ["honestcv.clientId","honestcv.qa"] — DONE
