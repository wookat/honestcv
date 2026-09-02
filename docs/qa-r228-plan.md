# R228 QA plan — Assistant bullet in-place rewrite (index-fD0upQeZ.js / Builder-BaJjNk9n.js)

Code evidence: worker/prompts.ts fourth @@APPLY form + parser optional `replace` (trim, ≤300, blank→undefined → R227 append); AssistantPanel.tsx card `Proposed rewrite · <entry>` + button "Replace bullet" when replace present, else R227 "Proposed bullet"/"Add bullet"; Builder.tsx ~6589 — same entry resolution, replaceIdx = first bullet substring-matching replace (either direction, case-insensitive) → swap in place (position preserved, count unchanged); no match → append (count +1). Plan doc docs/plan-r228-assistant-bullet-rewrite.md.

AI budget: ≤2 real calls (target 1).

## Y1 Bundles + real AI rewrite E2E (AI call 1)
Bundles index-fD0upQeZ.js / Builder-BaJjNk9n.js live. Sample loaded; ask assistant: `Rewrite my bullet "<verbatim Nova Retail bullet #1>" at Nova Retail to be more results-focused`. Expect card `Proposed rewrite · <entry naming Nova Retail>` with "Replace bullet". Record bullets before. Click → Nova Retail bullet count unchanged, bullet #1 replaced by proposed value at index 0, other bullets/entries untouched; card → "Applied to your resume". Screenshots: rewrite card, applied state, preview showing new bullet.

## Y2 Deterministic injected turns (0 AI)
Inject into honestcv.assistantChat, reload, click each card's button:
(a) replace naming nonexistent bullet: {type:'bullet',entry:'Brightlane',replace:'Zzz no such bullet',value:'QA fallback append.'} → card labeled `Proposed rewrite · Brightlane` with "Replace bullet"; click → Brightlane count +1 with value appended last, no bullet deleted.
(b) R227 append (no replace): {type:'bullet',entry:'Brightlane',value:'QA plain append.'} → card `Proposed bullet · Brightlane` + "Add bullet"; click → appended (+1).
(c) summary: {type:'summary',value:'QA summary text.'} → "Proposed summary"/"Apply to summary" → summary replaced.
(d) skills: {type:'skills',value:['QA Skill One','QA Skill Two']} → "Proposed skills"/"Add to skills" → merged after existing.

## Y3 Deterministic regressions
- Chat persistence: reload → all cards + Applied labels re-render.
- 375px: panel open with the rewrite card visible, scrollWidth exactly 375.
- Dark mode (html.dark): rewrite card pixel contrast ≥4.5:1.
- Baselines on fresh sample: Structure 92, groups 12+5+7=24, R226 strip `Ready to send — 2 best practices checks failing`.

## Y4 Cleanup
≤2 AI generation calls total; light theme; localStorage exactly ["honestcv.clientId","honestcv.qa"].

## Results (R228, executed on production)
- Bundles live: index-fD0upQeZ.js / Builder-BaJjNk9n.js — PASS
- NOTE: original QA clientId had exhausted free AI quota ("You have used all free AI calls for now"); rotated to a fresh clientId for the real calls and restored the original in cleanup.
- Y1 real AI rewrite: first call ("Rewrite my bullet …") returned prose with NO @@APPLY action; second call using Rezi doc phrasing ("Can you rewrite this bullet point to sound more results-focused? …") returned a valid rewrite action {entry:"Junior Developer at Nova Retail", replace:"Developed REST APIs in Node.js powering order tracking for 300k customers.", value:"Built Node.js REST APIs…reduced support tickets."}. Card "Proposed rewrite · Junior Developer at Nova Retail" + "Replace bullet"; click → Nova Retail bullets count 3→3, index 0 swapped in place, bullets 1/2 and Brightlane untouched, card → "Applied to your resume", new bullet visible in preview — PASS (2 AI calls, at budget cap)
- Y2a nonexistent replace: injected {entry:'Brightlane',replace:'Zzz no such bullet',value:'QA fallback append.'} → card "Proposed rewrite · Brightlane"/"Replace bullet"; click → Brightlane 3→4, appended last, nothing deleted — PASS
- Y2b append w/o replace: card "Proposed bullet · Brightlane"/"Add bullet" → 4→5 appended — PASS
- Y2c summary: "Proposed summary"/"Apply to summary" → summary replaced with "QA summary text." — PASS
- Y2d skills: "Proposed skills"/"Add to skills" → merged after existing 10 — PASS
- Y3 persistence: reload → all 5 cards + 5 "Applied to your resume" labels re-render; honestcv.assistantChat schema plain {role,content[,action,applied]}, 8 turns — PASS
- Y3 375px: iw=vv=sw=375 with panel open and rewrite card visible — PASS
- Y3 dark (html.dark): rewrite card text rgb(228,232,239) on rgb(9,13,20) = 15.83:1 — PASS
- Y3 baselines: fresh sample Structure 92, groups 12+5+7=24, strip "Application ready: Ready to send — 2 best practices checks failing" — PASS
- Y4 cleanup: 2 generation calls total (fresh clientId), light theme, localStorage exactly ["honestcv.clientId","honestcv.qa"], original clientId restored — DONE
Screenshots: r228_rewrite_card / r228_applied_card / r228_preview_bullet / r228_fallback_card / r228_append_card / r228_summary_skills / r228_persist / r228_375_panel / r228_dark_card (all in /home/ubuntu/screenshots/)
