# QA — R286 variant-picker Regenerate/Adjust footer (prod cv.zalize.com, expect index-Dw8U6jU0.js / Builder-DI8XCZAw.js)

Code-traced: Builder.tsx runRewrite 1261–1314 sets variantPick.regenerate (1303, same args →
identical /api/ai/rewrite payload); runSummaryDraft 1493–1530 sets regenerate (1518) and adjust
(1519–22 → reopens summaryDraftSetup prefilled {position,picked}); picker dialog 7275–7359: inline
destructive error <p> when aiError && aiErrorTag===variantPick.tag (7329–31), footer outline
"Regenerate options"/"Writing…" (7332–43), ghost "Adjust role & skills" only when variantPick.adjust
(7344–54); setup dialog "Draft my summary" 7430–7518 (position select/input id
summary-draft-position, skill chips aria-pressed, Draft button calls runSummaryDraft). Harness:
r283_lib buffered Fetch interception; every paused request fulfilled or failed pre-network. Zero
live AI.

## V1 Guided summary draft picker
Seed resume (exp with role+bullets, skills). Summary section → click "Draft my summary" → setup
dialog: pick position + 2 skill chips → click Draft. Intercept POST /api/ai/summary-draft, fulfill
200 {"texts":["A one.","B two.","C three."],"freeRemaining":42}. Assert: dialog "Pick a summary"
open with 3 candidate buttons containing A one./B two./C three.; footer has enabled outline
"Regenerate options" AND ghost "Adjust role & skills". Screenshot.
## V2 Regenerate identical payload + replacement
Click "Regenerate options": while paused, button text is "Writing…" (disabled) — screenshot; the
2nd summary-draft postData string is byte-identical to V1's; fulfill with
{"texts":["D four.","E five.","F six."],"freeRemaining":41}. Assert dialog still open, candidates
now D four./E five./F six. (A one. gone), free counter 41.
## V3 Adjust role & skills prefill
Click "Adjust role & skills": picker closes; "Draft my summary" setup dialog reopens with position
field equal to V1's pick and exactly the same 2 skill chips aria-pressed=true. Screenshot. Cancel.
## V4 Rewrite picker + regenerate failure path
Write rough summary "I build data tools and lead small teams.", click "AI polish summary" →
intercept POST /api/ai/rewrite, fulfill {"text":"X","texts":["X1","X2","X3"],"freeRemaining":41}.
Assert "Pick a rewrite"* dialog (*kind summary → title "Pick a summary") shows X1/X2/X3, has
"Regenerate options" and NO "Adjust role & skills" button. Click Regenerate → 2nd /api/ai/rewrite
postData byte-identical; this time Fetch.fulfillRequest 500 {"error":"Boom"}. Assert: dialog stays
open, inline destructive error line appears under candidates, X1/X2/X3 still present; click
candidate X2 → summary becomes "X2" and dialog closes (also covers V5 apply).
## V5 Regression keep-original
Re-open a picker (rewrite, fulfill again), click "Keep my original" → dialog closes, summary
unchanged from pre-click value.
## V6 mobile 375px
With a picker open at 375×812: scrollWidth==375, footer buttons within viewport. Screenshot.
## Safety/cleanup
Every paused request fulfilled/failed pre-network (none reach the LLM); localStorage exactly
["honestcv.clientId","honestcv.qa"] (remove honestcv.resume + honestcv.resumeHistory); empty html
class; screenshots /home/ubuntu/screenshots/r286_*.png.
