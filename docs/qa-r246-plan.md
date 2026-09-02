# R246 QA plan — "Details to highlight (optional)" on the Cover Letter tool

Code evidence: src/pages/Builder.tsx — `highlights` state :7938; textarea id `cover-highlights`, label "Details to highlight (optional)", rows=2, `sm:col-span-2`, rendered only for kind='cover' :8257–8266; reset on tool-kind switch :8012–8016 (`setHighlights('')` alongside `setAddressee('')`); offline template spotlight :8211–8215 — `\n\nI'd particularly like to highlight: <trimmed>.` appended after the "These map directly…" sentence, before "\n\nI'd welcome the chance…"; AI payload `highlights: highlights.trim() || undefined` :8169; src/lib/api.ts:133 optional `highlights?: string`. Bundles: index-DN7F5IhL.js / Builder-DkwlwdLy.js.

Method: production via CDP; fetch wrap captures /api/ai/cover-letter request bodies (quota gate expected to 402 — zero completions consumed, no clientId rotation); byte-exact template comparison computed from the code; screenshots (recording attempted once, known down).

## V0 Bundles
index-DN7F5IhL.js + Builder-DkwlwdLy.js live on /builder.

## V1 Field renders only in cover dialog
Open Cover Letter dialog → label "Details to highlight (optional)" + textarea#cover-highlights (rows=2) present under Company/Hiring-manager row. Open Interview and Resignation dialogs → no #cover-highlights, no such label. Screenshots.

## V2 Offline template — empty highlights byte-identical to R238
Seed known resume fields (fullName "QA Tester", targetRole "QA Engineer"), company "Acme QA", addressee empty, highlights empty → click "Start from a template" → result textarea value EXACTLY equals the R238 expected string (computed: `Dear Hiring Manager,\n\nI'm writing to apply for the QA Engineer position at Acme QA. [One sentence…]\n\nIn my current role…best].\n\nI'd welcome the chance to talk about how I can help Acme QA [team goal from the posting]. Thank you for your consideration.\n\nSincerely,\nQA Tester`) — assert equality programmatically, no spotlight paragraph.

## V3 Offline template — non-empty highlights (whitespace-padded)
Set highlights to `"  led the 2024 checkout redesign; fluent in Spanish  "` → template output contains `These map directly to what you're looking for: [requirement from the job description you meet best].\n\nI'd particularly like to highlight: led the 2024 checkout redesign; fluent in Spanish.\n\nI'd welcome the chance` (trimmed text, exact position); byte-exact full-string comparison. Screenshot of rendered letter.

## V4 AI payload capture
Fetch wrap on /api/ai/cover-letter. (a) highlights "  focus on Python  " → click Write for me → captured JSON body has `highlights === "focus on Python"` (trimmed); expect 402/quota gate response, no completion. (b) Clear highlights (blank) → Write for me → captured body has NO `highlights` key. Zero quota consumed (free counter unchanged / gate response).

## V5 Deep link
/builder?doc=cover&company=DeepCo → cover dialog opens with company input "DeepCo" and #cover-highlights value "" (empty).

## V6 Kind-switch reset
Type highlights text in cover dialog, close, open Resignation tool, then reopen Cover Letter → #cover-highlights value "" (reset).

## V7 Regression (R238/R239)
Addressee "Maya Chen" + empty highlights → template starts `Dear Maya Chen,`; empty addressee → `Dear Hiring Manager,`. R239 filename: save/download path on the cover result still produces the professional filename pattern (check the download anchor/attribute or saved-doc name).

## V8 375px + dark
375×812 cover dialog with highlights textarea: no horizontal overflow (iw==sw==375). Dark mode: rendered-pixel contrast of the label text and textarea placeholder/border region — report ratios (label ≥4.5). Screenshots.

## V9 Zero AI completions + cleanup
No successful /api/ai/* completions (only the 402-gated attempts in V4, quota unchanged). Final localStorage exactly ["honestcv.clientId","honestcv.qa"], light theme, resume draft removed, overrides cleared by reload. Screenshots r246_*.png; results appended below.

---

## Results (executed against production, bundles index-DN7F5IhL.js / Builder-DkwlwdLy.js)

- V0 bundles: index-DN7F5IhL.js + Builder-DkwlwdLy.js live on /builder — PASS
- V1 field scoping: Cover Letter dialog has label "Details to highlight (optional)" + textarea#cover-highlights rows=2 under the Company/Hiring-manager row; Interview prep and Resignation dialogs have neither the id nor the label — PASS (r246_cover_field.png, r246_interview_nofield.png, r246_resignation_nofield.png)
- V2 empty highlights → offline template byte-identical to the R238 string (programmatic === comparison with the code-derived expected string, company "Acme QA", name "QA Tester", role "QA Engineer") — PASS (r246_template_empty.png)
- V3 padded highlights "  led the 2024 checkout redesign; fluent in Spanish  " → full output byte-identical to expected with `I'd particularly like to highlight: led the 2024 checkout redesign; fluent in Spanish.` inserted after "…you meet best]." and before "I'd welcome the chance…" (trimmed) — PASS (r246_template_highlights.png)
- V4 AI payload: with jd seeded, Generate with "  focus on Python  " → one POST /api/ai/cover-letter, status 402 (quota gate, free counter stayed 0 — zero completions), body.highlights === "focus on Python" (trimmed by Builder); blank "   " → body has NO highlights key — PASS (r246_ai_gate.png)
- V5 deep link /builder?doc=cover&company=DeepCo → dialog open, company "DeepCo", highlights "" — PASS (r246_deeplink.png)
- V6 kind-switch reset: typed text, closed, opened Resignation, reopened Cover → highlights "" — PASS (r246_reset.png)
- V7 regression: addressee "Maya Chen" + empty highlights → letter starts "Dear Maya Chen," with no spotlight paragraph; empty addressee → "Dear Hiring Manager," (V2); R239 filename on DOCX download: "qa-tester-acme-qa-cover-letter.docx" — PASS (r246_addressee.png)
- V8 375×812 dialog with textarea: innerWidth/scrollWidth 375/375, dialog scrollWidth<=clientWidth (r246_375_dialog.png); dark mode: label contrast 15.83:1, textarea placeholder 6.77:1 — PASS (r246_dark_dialog.png, r246_dark_label_crop.png)
- V9 zero completions (only two 402-gated attempts, intended); cleanup: final localStorage exactly ["honestcv.clientId","honestcv.qa"], light theme — DONE (r246_cleanup_final.png)

Recording: none — service still down (ffmpeg exits immediately; attempted once).
Disclosures: company input id is `#company` (not `#cover-highlights`-style `#cover-company`); the AI submit button is labeled **"Generate"** (not "Write for me"); an empty Target-job description blocks the AI call client-side with "Paste the job description…" before any fetch — jd must be seeded to capture the payload. First V2 run failed only because my selector missed #company (rerun byte-identical).
