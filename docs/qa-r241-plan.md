# R241 QA plan — structured job-description sections in /jobs detail pane

Code evidence: src/lib/jobs.ts:96–132 — HEADING_KEYWORD list :96–97; isHeadingLine :100–105 (reject empty/'•'-start/digit-start/>60 chars; colon-terminated → ≤8 words; else ≤5 words AND keyword-led AND no terminal [.!?,;:]); structureJobDescription :112–132 (preamble heading:null, trailing colon stripped `\s*:$`, no headings → single unlabelled section). Jobs.tsx:862–878 render: `<section>` per part, mt-4 between, `<h3 class="text-foreground/80 text-xs font-semibold tracking-wide uppercase">`, body `<p class="text-muted-foreground whitespace-pre-wrap text-sm">`. "Write a cover letter" intent saves draft with `jobDescription: job.description` (Jobs.tsx:308–317); target intent creates version with full description (:271–282). Fixture injection: intercept fetch of `/api/jobs/search` (jobs.ts:81) returning `{jobs:[{id,title,company,category,type,location,postedAt,salary,url,description}]}`. Bundles: index-A3mV5Bg7.js / Jobs-CL5cSJIh.js.

Method: zero /api/ai/* asserted with a fetch counter for the whole round; screenshots (recording attempted once, service known down).

## P0 Bundles
index-A3mV5Bg7.js live; Jobs-CL5cSJIh.js loaded on /jobs.

## P1 Real listing with headings
/jobs, search "engineer"; pick a listing whose raw description contains colon headings (inspect selected.description via jobs state/DOM). Expect: detail pane shows `<h3>` uppercase-rendered headings with trailing colon stripped, preamble paragraph (if any) unlabelled above the first h3, bullet lines inside `<p>` bodies (not headers). Screenshot of the sectioned pane.

## P2 Fixture heuristic matrix (injected listing)
Intercept /api/jobs/search to return one fixture job whose description exercises:
- preamble line before first heading → heading:null block
- `About the role:` (colon, 3 words) → heading "About the role"
- `Requirements :` (space before colon) → heading "Requirements"
- `This colon line has way too many words to be a heading:` (10+ words) → NOT a heading (stays in body)
- `Responsibilities` (keyword, no colon) → heading
- `Nice-to-Have Technical Skills` (keyword, 4 words) → heading
- `3+ years of experience with Go` (digit start) → body
- `• Ship features fast` bullets → body
- `Experience matters.` (keyword but ends '.') → body
Assert rendered h3 texts exactly ["About the role","Requirements","Responsibilities","Nice-to-Have Technical Skills"] and that the non-heading lines appear inside `<p>` bodies. Screenshot.

## P3 No-headings description
Second fixture job: multi-line description with zero heading-like lines → exactly 1 `<section>`, 0 `<h3>`, single whitespace-pre-wrap `<p>` (R240-equivalent). Screenshot.

## P4 Full raw description copied (display-only structure)
On the fixture listing click "Write a cover letter" → confirm dialog → "Open cover letter tool" → lands on /builder?doc=cover; assert localStorage honestcv.resume.jobDescription === fixture description byte-for-byte (headings + bullets + the long colon line intact).

## P5 Regression
/jobs?q=Product%20Manager deep link still seeds input + mount search (API URL). Assistant "Find matching jobs" card link still /jobs?q=…. Save → Tracked (1); tracked entry shows status timeline + notes box + next-step box; match % chip present on cards. Screenshots labelled Regression.

## P6 375px + dark
375×812 detail pane with sectioned fixture: iw/sw 375/375, no horizontal overflow. Dark mode: core-pixel contrast of an `<h3>` section header crop — report ratio (≥4.5 expected). Screenshots.

## P7 Zero AI + cleanup
window fetch counter shows zero /api/ai/* calls all round. Final localStorage exactly ["honestcv.clientId","honestcv.qa"], light theme, overrides cleared by reload. Screenshots r241_*.png; results appended below.

---

## Results (executed on production, recording service down — CDP screenshots)

- P0 PASS — index-A3mV5Bg7.js + Jobs-CL5cSJIh.js live on /jobs.
- P1 PASS — real listing "Senior React Full-stack Developer" (search "engineer"): 5 sections, first section heading:null preamble ("Are you a talented Senior Developer…"), h3s ["What we offer","Requirements for the Senior Node & React Position","Commercial experience","Other requirements"] (trailing colons stripped), computed text-transform uppercase, bullets stay inside `<p>` bodies (r241_real_sections.png).
- P2 PASS — injected fixture via /api/jobs/search intercept: rendered h3s exactly ["About the role","Requirements","Responsibilities","Nice-to-Have Technical Skills"]; "Requirements :" → "Requirements"; the 12-word colon line, "3+ years…" digit line, "• …" bullets stayed in the Requirements body; "Experience matters." (terminal '.') stayed in the Responsibilities body; preamble unlabelled (r241_fixture_sections.png).
- P3 PASS — plain fixture with zero heading-like lines: 1 `<section>`, 0 `<h3>`, single whitespace: pre-wrap `<p>` with all 3 lines (R240-equivalent) (r241_plain_block.png). Note: first click on the list row via generic selector didn't switch selection; clicking the row's inner `<button>` works — assertion was rerun and passed.
- P4 PASS — "Cover letter" button → confirm dialog `Write a cover letter for "QA Fixture Engineer"?` → "Open cover letter tool" → Builder Cover Letter dialog open, company seeded "Acme QA", and localStorage honestcv.resume.jobDescription **byte-equal** to the raw fixture description (headings + colons + bullets intact — structure is display-only); targetRole "QA Fixture Engineer" (r241_cover_confirm.png, r241_cover_builder.png).
- P5 PASS (regression) — /jobs?q=Product%20Manager seeds input + mount request /api/jobs/search?q=Product+Manager; Save → Tracked (1) with Saved timeline, notes box, "Next step:" box, "Targeted copy: 0% keyword match" chip (r241_regression_tracked.png); assistant "Find matching jobs" card → /jobs?q=QA%20Fixture%20Engineer (current draft role), zero AI calls (r241_regression_assistant.png).
- P6 PASS — 375×812: sectioned detail renders all 4 h3s, innerWidth/scrollWidth 375/375, no horizontal overflow (r241_375_sections.png); dark mode h3 "REQUIREMENTS" core-pixel contrast **9.69:1** (r241_dark_sections.png).
- P7 DONE — window.__ai stayed [] on every page (zero /api/ai/* calls); final localStorage exactly ["honestcv.clientId","honestcv.qa"], light theme, interceptors/viewport cleared by reload.
