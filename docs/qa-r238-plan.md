# R238 QA plan — Cover Letter "Hiring manager (optional)" addressee field

Code evidence: src/pages/Builder.tsx — addressee state 7937; reset to '' on kind change 8011–8014; offline template salutation `const to = addressee.trim() || 'Hiring Manager'` 8200–8203; field rendered only for kind==='cover' in sm:grid-cols-2 next to Company (8236–8243, id cover-addressee); AI call passes `addressee: addressee.trim() || undefined` 8159. src/lib/api.ts 127–136 aiCoverLetter posts to /api/ai/cover-letter. worker/index.ts 876/885 accepts body.addressee → prompts.ts 243–253 appends `Addressed to: <name>` to user message. Bundles expected: index-Cu1130dw.js / Builder-DT2YoJ4f.js.

Quota constraint: QA clientId AI quota exhausted — verify the AI path by capturing the fetch request body client-side (wrap window.fetch, log body, forward; 402 response acceptable). Do NOT rotate clientId / burn quota.

## L0 Bundles
index-Cu1130dw.js / Builder-DT2YoJ4f.js live.

## L1 Field presence per kind
Open Cover letter tool → input `#cover-addressee` with label exactly "Hiring manager (optional)", placeholder "e.g. Maya Chen", in a 2-col grid with Company name (same row at ≥sm: equal y). Open Resignation letter and Interview prep dialogs → `#cover-addressee` absent. Screenshots (cover dialog; resignation without field).

## L2 Offline template salutation
Cover dialog, company "Stripe", addressee "Maya Chen" → Insert template → letter starts exactly `Dear Maya Chen,` and rest matches known template (role/co interpolation). Clear addressee to '' → Insert template → starts `Dear Hiring Manager,` and full text byte-identical to the pre-R238 template string computed locally from source (8202). Screenshots both.

## L3 AI payload capture
Wrap window.fetch logging /api/ai/cover-letter bodies. Paste ≥40-char JD, addressee " Maya Chen " (padded) → Write with AI → captured body has `addressee:"Maya Chen"` (trimmed) + company/role/resumeText/jobDescription; response 402 acceptable. Repeat with blank addressee → body has NO `addressee` key. Restore real fetch. Evidence: logged JSON (text), screenshot of 402 error state optional.

## L4 Reset on kind change
Type addressee "Maya Chen" in cover → close → open Resignation letter → reopen Cover letter → `#cover-addressee` value '' (and result cleared). Pass: empty string.

## L5 Deep link
Navigate /builder?doc=cover&company=Stripe → cover dialog auto-opens with Company prefilled "Stripe", addressee ''. Screenshot.

## L6 Regression
R237 smoke: Compare chip ON → select 2 thumbs → "Compare 2 side by side" opens dialog with 2 columns → close, chip OFF. ATS visible score 99/100 unchanged (example fixture). Resignation letter Insert template still works (starts "Dear" / contains res-company text unchanged behavior: just verify template inserts and no addressee interpolation).

## L7 375×812 + dark
375: cover dialog fields stacked (company & addressee inputs same x, different y), innerWidth/scrollWidth 375, no overflow. Screenshot. Dark (desktop): core-pixel contrast of "Hiring manager (optional)" label and typed input text ≥4.5:1. Screenshot.

## L8 Cleanup
Restore fetch by reload; zero /api/ai generation calls EXCEPT the two intentional captured cover-letter POSTs (report count + status); localStorage exactly ["honestcv.clientId","honestcv.qa"]; light theme. Screenshots r238_*.png; results appended below.

## Results (production, index-Cu1130dw.js / Builder-DT2YoJ4f.js)
- L0 bundles live — PASS
- L1 cover dialog: #cover-addressee, label "Hiring manager (optional)", placeholder "e.g. Maya Chen", same row as Company (2-col grid); absent in Resignation (res-company/res-role/res-last-day/res-reason only) and Interview prep — PASS. Note: company input id is `company`, not `cover-company`.
- L2 offline template: addressee "Maya Chen" → letter byte-identical to expected with "Dear Maya Chen,"; blank → byte-identical "Dear Hiring Manager," template — PASS. Note: after first result, button label switches Insert template → "Start from a template"; AI button is "Generate".
- L3 payload: fetch wrapper captured POST /api/ai/cover-letter; "  Maya Chen  " → body addressee:"Maya Chen" (trimmed) with keys [addressee,company,jobDescription,resumeText,role]; blank → addressee key ABSENT. Both calls hit quota message ("used all free AI calls… reset within 30 days") — no quota burned, payload shape proven — PASS
- L4 reset: addressee typed → close → Resignation → reopen Cover → '' — PASS
- L5 deep link ?doc=cover&company=Stripe: dialog auto-open, company "Stripe", addressee '' — PASS
- L6 regression: Compare smoke (chip ON, 2 selected, "Compare 2 side by side" dialog opens) PASS; ATS 100/100 identical before/after (JD fixture raised example resume to 100); Resignation Insert template works ("Dear [Manager name],") — PASS
- L7 375×812: fields stacked, iw/sw 375/375 — PASS; dark contrast label 15.83:1, input text 13.62:1 (core-pixel) — PASS
- L8 cleanup: localStorage exactly ["honestcv.clientId","honestcv.qa"], light theme, fetch wrapper cleared by reload — DONE. Screenshots /home/ubuntu/screenshots/r238_*.png. Recording service unavailable.
