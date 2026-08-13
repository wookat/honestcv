# I25–I27 live test plan (cv.zalize.com, main dffceec, worker 6b8d2655)

Code grounding: I25 resume.ts exampleToResume — `/^(.*?),\s*(\d{4})$/` on schoolPart → school without year, endDate=year (old: school "UNC Charlotte, 2021", endDate ""). Data Analyst example education = "B.S. Industrial Engineering — Georgia Tech, 2021". I26: 5 new pages 200, examples.json has 20 entries (curl-verified); picker in Builder.tsx lists all entries. I27: hub 5 h2 groups + numberOfItems 20 (curl-verified); Landing.tsx:238 "20 complete resume examples by role" (in deployed bundle index-CyGc38j4.js). Rules: qa=1, 0 AI calls, no payment, no wookat@qq.com.

## 1. I25 — education year split (via picker)
- Clean profile (honestcv.resume cleared pre-recording). /builder empty-state picker → choose "Data Analyst".
- PASS: Education card shows Degree "B.S. Industrial Engineering", School "Georgia Tech" (NO ", 2021"), End date field "2021"; preview education line renders the degree/school with 2021 as a date.
- FAIL: school field contains "Georgia Tech, 2021" and end date empty (pre-I25 behavior).

## 2. I26 — 20 roles: picker + new page + deep link
- Picker select lists 20 role options (count) including Electrician.
- Visit /examples/electrician/: standard layout — h1, example card, fictional disclaimer, 3 tips h2s, "How to write yours" links, CTA href="/builder?example=electrician".
- Click "Edit this example in the builder" → builder loads the electrician example person (name/title from page card), with confirm dialog since Data Analyst content present; OK replaces.
- PASS: all above; FAIL: 15-role picker, 404, missing CTA, no confirm/load.

## 3. I27 — hub grouping + landing blurb
- /examples/ shows 5 h2 groups (Tech & data / Business & finance / Healthcare & education / Trades & transport / Customer-facing & office); script check: 20 unique /examples/<slug>/ links all 200; ItemList numberOfItems 20.
- Landing template-gallery blurb reads "20 complete resume examples by role" (visible, click → /examples/).

## 4. Standard checks
- 375px: /examples/ hub and /builder with picker open (fresh empty state not needed — builder after example load) → scrollWidth ≤ 375. Picker-open @375: use a clean tab? (picker only in empty state — do 375 check on hub + builder-with-content; plus separately clear resume in an emulated tab to show picker at 375 if cheap).
- axe A/AA: 0 violations on /examples/ and /builder desktop.
- Console: zero product errors (cloudflare beacon block known).

Budget: 0 AI calls. Record with annotations.
