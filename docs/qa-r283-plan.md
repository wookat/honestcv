# QA — R283 Projects/Involvement whole-entry AI rewrite pair (prod cv.zalize.com, expect index-CEqKDzGO.js / Builder-D8-Dz2hD.js)

Code-traced: Builder.tsx projects pair 3531–3575 (tags `proj-<id>` / `proj-<id>-nums`), involvement
pair 3877–3925 (`inv-<id>` / `inv-<id>-nums`); notReady = `!description.trim() && 'Write a rough
bullet first — the AI rewrites your draft, it never invents experience.'` (3560–3561 / 3906–3907);
runRewrite → api.ts:58 body `{kind:'bullets', text, variants:true, emphasis?}`; per-line guidance
Fix button label `Fix line N with AI` (8277), tag `proj|inv-<id>-line-<idx>`.

Harness: CDP :29229 seeded fixture (project + involvement entries, 2-line descriptions);
event-buffered Fetch.enable `*api/ai/rewrite*` + immediate Fetch.failRequest — never leave a
paused request when disabling. Zero live AI.

## P1 Projects pair — payloads (intercepted, no network)
Project "Widget Tool" description two lines ("Built data pipeline.\nCut costs.").
Row below guidance shows `AI rewrite bullets` then `…with key numbers`, both enabled.
Click plain → captured body kind:"bullets", variants:true, NO emphasis key, text ==
"Built data pipeline.\nCut costs."; aborted. Click key-numbers → same but emphasis:"key-numbers";
aborted. Screenshot row + post-abort state.
## P2 Projects empty description
Blank the description → both buttons disabled, title exactly "Write a rough bullet first — the AI
rewrites your draft, it never invents experience." (NOT "0 free AI uses left"). Screenshot.
## P3 Involvement pair — same as P1+P2
Involvement "Volunteer Lead / Code Club" description "Mentored students.\nRan workshops." →
same 2-button row; intercepted plain body has no emphasis + text matches; key-numbers body has
emphasis:"key-numbers"; blank description → both disabled with the same reason tooltip.
## P4 Regression
Experience entry row still exactly Suggest a bullet / …with key numbers / AI rewrite bullets /
…with key numbers. Per-line Fix: seed a project line that trips guidance (e.g. lowercase
"built stuff"), click `Fix line 1 with AI` → intercepted body kind:"bullets", text == that line,
NO emphasis; aborted before network.
## P5 mobile 375px
375x812 emulation: Projects + Involvement sections render, innerWidth=scrollWidth=375
(no horizontal overflow), both new rows visible; screenshot.
## Safety/cleanup
No un-failed paused requests; localStorage exactly ["honestcv.clientId","honestcv.qa"]; empty html
class; screenshots /home/ubuntu/screenshots/r283_*.png.
