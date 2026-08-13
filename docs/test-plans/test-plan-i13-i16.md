# I13/I14/I16 live test plan (cv.zalize.com, main 05140fa, version 949d6fc4)

Code grounding: I16 loader Builder.tsx:383-416 — fetches /examples/examples.json, confirm text "Replace your current resume content with this example? Your saved copies are unaffected." only when cur.contact.fullName || cur.summary; history.replaceState strips ?example. I14 Builder.tsx:548 — gate dialog only when !hasSubscribed() && !honestcv.shared. I13 Landing.tsx:238 — "15 complete resume examples by role" link in template gallery section. Deployment verified via curl (CTA href="/builder?example=accountant", examples.json 200). No AI calls (relay 401).

## 1. I16 happy path (clean profile)
- Setup (pre-recording ok): remove honestcv.resume; honestcv.qa=1.
- From /examples/accountant/ click primary CTA "Edit this example in the builder".
- PASS: /builder loads with NO confirm dialog; editor shows Elena Vasquez / Senior Accountant, CPA / Charlotte, NC; Experience role 1 = Senior Accountant — Piedmont Building Products with start "2022" end "Present" split into separate fields; skills comma-joined; education degree "B.S. Accounting" school "UNC Charlotte"; certifications field has CPA entry; preview renders Elena Vasquez; Resume strength/ATS panel computes; URL is /builder (no ?example=); reload does NOT re-load or prompt.
- FAIL: sample Jordan Reyes or empty editor, dates unsplit, ?example remains, confirm shown on empty profile.

## 2. I16 confirm path (existing content)
- With Elena content present, navigate to /builder?example=teacher.
- PASS: window.confirm with exact text above appears; Cancel → editor still Elena Vasquez; retry /builder?example=teacher, OK → editor now Rachel Nguyen (teacher example).
- FAIL: no dialog, or Cancel replaces content, or OK keeps old content.

## 3. I14 gate skip
- Set honestcv.shared='1', remove honestcv.subscribed; click PDF download.
- PASS: no "Downloads are included in the beta trial" email dialog; PDF downloads directly (file appears in ~/Downloads with teacher/elena name).
- FAIL: email dialog appears.

## 4. I13 landing link
- On / scroll to the template gallery section; link "15 complete resume examples by role" visible; click → /examples/ hub loads.

## 5. Console + 375px on builder after example load
- Console: zero real errors (beacon block ok). CDP 375px on /builder: scrollWidth ≤ 375.

Budget: 0 AI calls. No payment, never wookat@qq.com. Record with annotations.
