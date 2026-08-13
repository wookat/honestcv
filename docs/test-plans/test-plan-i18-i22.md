# I18–I22 live test plan (cv.zalize.com, main ee9d87e, worker ad00a972)

Code grounding: I22 Builder.tsx — examples fetched once into state; `applyExample` (confirm "Replace your current resume content with this example? Your saved copies are unaffected." only when fullName||summary; keep non-classic template); empty-state card shows "Or start from your role:" + `<select id="example-role">` (15 options + "Choose a role…"). I16 deep link now routed through the same effect (param stripped via replaceState). I21 build-seo.mjs examplePage — `.exrole` is flex flex-wrap; new "How to write yours" h2 with 4 guide links + All resume guides. I20/I19/I18 verified deployed via curl (6 h2 groups, 35 guide links, photo-on-resume present, ItemList JSON-LD). Rules: honestcv.qa=1, 0 AI calls, no payment, no wookat@qq.com.

## 1. I22 picker — clean profile
- Setup (pre-recording): clear honestcv.resume; qa=1.
- /builder empty-state card shows "Or start from your role:" with select. Open select → 15 role options. Choose "Accountant".
- PASS: editor loads Elena Vasquez / Senior Accountant, CPA / Charlotte, NC without any confirm; preview renders; ATS/strength computes.
- FAIL: no picker, empty editor, or confirm on clean profile.

## 2. I22 picker — confirm on non-empty resume
- With Elena content, pick "Teacher" from... (picker only shows on empty state — instead verify confirm via picker is impossible; the empty-state card is gone once content exists). So: verify the card/picker disappears with content present (expected: picker is part of empty-state card).
- Then test the confirm rule via the deep link (step 3) which shares applyExample.

## 3. I16 deep-link regression (refactor risk)
- With Elena content: navigate /builder?example=teacher.
- PASS: exact confirm text appears; Cancel → still Elena; retry + OK → Rachel Nguyen (High School English Teacher, Sacramento, CA), dates split; URL stripped to /builder; F5 reload keeps Rachel, no re-prompt.
- FAIL: no confirm, Cancel replaces, OK keeps old, ?example persists, reload re-prompts.

## 4. I21 example page @375px
- /examples/accountant/ at 375px: role/company/date line wraps cleanly (date drops below or beside without overlap); scrollWidth ≤ 375. "How to write yours" list with 4 guide links + "All resume guides"; click one guide link → 200 page.

## 5. I20 guides hub grouping + link integrity
- /guides/ shows 6 h2 groups (Start here / Writing the content / Tailoring to a job / Your situation / What to include — and leave off / Beyond the resume); all 34 guide links present (script HEAD-check each href → all 200). photo-on-resume listed under "What to include — and leave off".

## 6. I19 new guide
- /guides/photo-on-resume/ renders h1 + 12 TOC/sections; anchor click jumps.

## 7. I18 JSON-LD (objective, no visual)
- curl: /guides/ and /examples/ contain `"@type":"ItemList"` JSON-LD parsing as valid JSON.

## 8. Console + 375px builder + axe
- Console on visited pages: zero product errors (cloudflare beacon block ok).
- /builder @375 after example load: scrollWidth ≤ 375.
- axe A/AA: 0 violations on /guides/ and /builder (desktop).

Budget: 0 AI calls. Record with annotations (steps 1–6).
