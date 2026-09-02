# R229 QA plan — Assistant @@APPLY obligation (worker-only prompt change)

Code evidence: worker/prompts.ts:376 — "Exception:" wording is now an obligation: for qualifying edit requests the reply "MUST propose one concrete edit … answering such a request with prose alone and no tail is an error". Plan doc docs/plan-r229-assistant-apply-reliability.md. No client change expected (index-fD0upQeZ.js / Builder-BaJjNk9n.js still live).

Setup: rotate fresh honestcv.clientId (original saved, restore in cleanup). Budget ≤4 real AI calls.

## Z0 Bundles unchanged
index-fD0upQeZ.js / Builder-BaJjNk9n.js live (deterministic — proves worker-only deploy).

## Z1 Headline: R228-failing plain phrasing now emits rewrite tail (AI call 1)
Fresh sample; ask exactly: `Rewrite my bullet "Developed REST APIs in Node.js powering order tracking for 300k customers." at Nova Retail to be more results-focused` (verbatim R228 failing prompt).
Pass: stored assistant turn has action `{type:'bullet', entry~Nova Retail, replace, value}`; visible card `Proposed rewrite · <entry>` + "Replace bullet" button (screenshot). Fail: action null / prose only (that was the R228 behavior — direct discriminator).

## Z2 Plain append phrasing (AI call 2)
Ask: `Write a stronger bullet for my Brightlane role`.
Pass: action `{type:'bullet', entry~Brightlane, no replace}`; card `Proposed bullet · <entry>` + "Add bullet". Screenshot.

## Z3 Negative: non-edit question stays tail-free (AI call 3)
Ask: `How do I improve my ATS score?`
Pass: assistant turn action is null/absent, no new "Proposed" card, and no literal "@@APPLY" text visible in the panel/DOM. Screenshot of prose reply.

## Z4 Summary regression if budget allows (AI call 4)
Ask: `Please rewrite my summary`.
Pass: action `{type:'summary', value}`; card "Proposed summary" + "Apply to summary". (Skip if any earlier case needed a retry call.)

## Z5 Cleanup
≤4 AI calls total; original clientId restored; localStorage exactly ["honestcv.clientId","honestcv.qa"]; light theme.
Screenshots r229_*.png in /home/ubuntu/screenshots/; results appended here.

## Results (R229, executed on production, fresh clientId rotated + restored)
- Z0 bundles: index-fD0upQeZ.js / Builder-BaJjNk9n.js still live (worker-only deploy confirmed) — PASS
- Z1 headline (verbatim R228-failing phrasing 'Rewrite my bullet "Developed REST APIs…300k customers." at Nova Retail to be more results-focused'): action {type:'bullet', entry:'Junior Developer at Nova Retail', replace:<verbatim original>, value:'Built Node.js REST APIs…[metric]% rise…'}; card "Proposed rewrite · Junior Developer at Nova Retail" + "Replace bullet" — PASS (was action:null in R228)
- Z2 'Write a stronger bullet for my Brightlane role': tail emitted, but as a REWRITE — action carried replace:<Brightlane bullet #1 verbatim> and value is a strengthened version of that same bullet; card "Proposed rewrite · Software Engineer at Brightlane" ("Replace bullet"), not the expected append "Proposed bullet"/"Add bullet" — DEVIATION (obligation satisfied; model interpreted "stronger bullet" as strengthening an existing one; grounded, single tail, valid replace)
- Z3 negative 'How do I improve my ATS score?': prose grounded in live report ("Your ATS score is 92/100. The two failing checks are: Skills grouped…"), action null, card count unchanged (2), no literal "@@APPLY" anywhere in body text — PASS
- Z4 'Please rewrite my summary': action {type:'summary', value}; card "Proposed summary" + "Apply to summary" — PASS
- Cleanup: exactly 4 AI calls (budget cap), original clientId restored, localStorage exactly ["honestcv.clientId","honestcv.qa"], light theme — DONE
Screenshots: r229_plain_rewrite_card / r229_brightlane_card / r229_negative_prose / r229_summary_card (in /home/ubuntu/screenshots/)
