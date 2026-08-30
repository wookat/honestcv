# R85 — "…with key numbers" Suggest-a-bullet variant (bundle index-BK71lb7m.js / Builder-DfDWiSHr.js, commit b1a0939, budget: exactly 1 AI call)

Code: Builder.tsx L1598+ adds aiButton `exp-<id>-suggest-nums` label "…with key numbers" right after "Suggest a bullet", same disabled rule (role AND company empty); runSuggestBullet(e,'key-numbers') → api aiSuggestBullet passes variant; worker whitelists variant==='key-numbers'; prompt requires quantified bullet with ALL numbers as bracketed placeholders ([add %], [add $ amount], [add number]).

Setup: backup honestcv.* → qa.r85.backup, clear, hard reload (verify Builder chunk DfDWiSHr), load example resume. Record.

## T1 Desktop button presence + disabled rule
- Each Experience entry shows BOTH "Suggest a bullet" and "…with key numbers" (DOM order: suggest, suggest-nums, AI rewrite bullets).
- Add an empty entry (role+company blank): both suggest buttons disabled=true; filled entries: both enabled.
- FAIL if second button missing or disabled rule differs.

## T2 One real key-numbers call (network-captured)
- Arm CDP Network capture. Click "…with key numbers" on entry 1 (Software Engineer @ Brightlane).
- PASS: exactly ONE POST /api/ai/suggest-bullet whole run; request body contains "variant":"key-numbers"; response {text, freeRemaining} captured via Network.getResponseBody; appended bullet === server text byte-for-byte (single line, ends with period); bullet contains ≥1 bracketed numeric placeholder matching /\[add [^\]]*\]/; NO concrete digits outside brackets (regex: strip bracketed spans, then /\d/ must not match); quota footer decrements exactly 1 (12→11 on throwaway).
- FAIL if variant absent from payload, concrete numbers appear, or >1 AI call.

## T3 Regression (DOM only, no clicks on AI)
- Plain "Suggest a bullet" still present + enabled on filled entry (do NOT click).
- R84 Mono: click Mono font button → preview inline font-family becomes "Courier New", ui-monospace, monospace (then click Auto to revert).

## T4 Mobile 375px
- Held CDP 375: both suggest buttons visible in Edit pane, heights ≥40px, scrollWidth=375, scrollX=0.

## T5 Hygiene + cleanup
- Instrumented reload: 0 console/page errors; non-quota /api/ai/* count for whole run == 1 (the T2 call).
- Restore honestcv.* byte-for-byte (diffs:[], extra:[] before deleting qa.*), kill hold separately, desktop 1600, baseline Jordan Reyes score 100.
