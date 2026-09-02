# R227 QA plan — Assistant bullet proposal (index-DqHxtJWU.js / Builder-D03x1YPh.js)

Code evidence: worker/prompts.ts third @@APPLY form + parseAssistantAction bullet branch (entry ≤80, value ≤300); AssistantPanel.tsx validAction bullet variant, card "Proposed bullet · <entry>", button "Add bullet"; Builder.tsx onApply ~6578 — first non-hidden experience entry with company/role case-insensitive substring match (either direction), fallback visible[0], appends value to bullets (blank-filtered). Plan doc docs/plan-r227-assistant-bullet-action.md.

AI budget: ≤3 real generation calls total.

## X1 Bundles + bullet proposal E2E (AI call 1)
Bundles index-DqHxtJWU.js / Builder-D03x1YPh.js live. Sample resume loaded; open Resume assistant; ask "Write a stronger bullet for my <sample company #2> role". Expect prose reply + card titled exactly `Proposed bullet · <entry>` (entry names that company/role) with "Add bullet" button. Record target entry's bullet count before. Click Add bullet → card flips to "Applied to your resume"; target entry bullets count +1 in editor textarea AND new bullet text visible in preview; other entries unchanged. Screenshot proposal card + applied editor/preview.

## X2 Regression: summary proposal (AI call 2)
Same chat: "Please rewrite my summary". Card "Proposed summary" + "Apply to summary"; apply → summary field replaced with proposed text, card flips to Applied.

## X3 Regression: skills proposal (AI call 3)
Same chat: "Suggest skills to add". Card "Proposed skills" + "Add to skills"; apply → new skills merged into skills field (existing kept).

## X4 Deterministic (no AI)
- honestcv.assistantChat persists across reload with turns + action objects; applied flags retained.
- R226 strip on fresh sample still `Ready to send — 2 best practices checks failing` (score may shift after edits — verify on the same modified resume that strip/score are self-consistent; then baseline check on fresh sample: 92, 24 rows, strip text exact).
- R225 chip regression not repeated (covered R226) — only confirm chips container unaffected if visible.
- 375px: assistant panel open with the bullet proposal card visible → document scrollWidth 375, no horizontal overflow.
- Dark mode: proposal card text/bg pixel contrast ≥4.5:1 (border/muted tokens).

## X5 Mismatch fallback
Only if a real proposal names an entry not matching any company/role (cannot force with real AI): verify it appends to first visible entry. Otherwise mark untested. Deterministic alternative if chat schema permits: inject a crafted assistant turn with action {type:'bullet',entry:'Zzz Nonexistent',value:'…'} into honestcv.assistantChat, reload, click its Add bullet → bullet lands on first visible entry. Use this only if the stored schema visibly matches (validAction gate).

## X6 Cleanup
Zero extra AI calls beyond the 3; light theme; localStorage exactly ["honestcv.clientId","honestcv.qa"].

## Results (executed on production)
- X1: bundles index-DqHxtJWU.js / Builder-D03x1YPh.js live. Asked "Write a stronger bullet for my Nova Retail role" → card `Proposed bullet · Junior Developer at Nova Retail` with "Add bullet"; click → Nova Retail bullets 3→4, Brightlane unchanged, card "Applied to your resume", bullet text visible in preview. PASS (1 AI call)
- X2: "Please rewrite my summary" → "Proposed summary"/"Apply to summary"; summary replaced with proposed text, Applied. PASS (1 AI call)
- X3: "Suggest skills to add" → "Proposed skills"/"Add to skills"; 5 new skills appended, existing 10 kept. PASS (1 AI call)
- X4: honestcv.assistantChat = array of {role,content[,action,applied]} — schema unchanged; after reload all 3 cards + 3 "Applied to your resume" labels persist. Fresh sample: Structure 92, 12+5+7=24, R226 strip exact. 375px with panel + bullet card: scrollWidth 375. Dark card contrast 15.83:1 ((228,232,239) on (9,13,20)). PASS
- X5 fallback (deterministic injection): appended crafted turn action {type:'bullet',entry:'Zzz Nonexistent Corp',...} to honestcv.assistantChat; card rendered `Proposed bullet · Zzz Nonexistent Corp`; Add bullet → landed on first visible entry Brightlane (3→4). PASS
- X6: exactly 3 AI generation calls total; light theme; localStorage exactly ["honestcv.clientId","honestcv.qa"]. DONE
