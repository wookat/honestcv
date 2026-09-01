# R158 QA plan — Conversational field labels on Experience/Education cards (bundles index-BY8Z0Egc.js / Builder-C5u3On1S.js)

Code evidence (diff on devin/1788243655-r158-conversational-labels):
- Builder.tsx ~L2319: Experience expanded card fields wrapped with `<Label htmlFor="exp-{id}-role|company|location|start|bullets">`; texts: "Your role at {company}" / "Your role", "Which company was this?", "Where was {company} based?" / "Where was this?", "When were you at {company}?" / "When was this?", "What did you achieve at {company}?" / "What did you achieve?". Interpolation uses `e.company.trim()`.
- Education ~L2638: "Degree and major", "Where did you study?", "Where is {school} located?" / "Where is it located?", "When did you study?" (ids edu-{id}-degree/school/location/start).
- MonthYearField.tsx: forwards `id` to inner Input; only start date gets the id/label.
- Labels render only inside `!collapsedEntries.has(e.id)` block — collapsed header unchanged.

Fixture: standard (/tmp/r1371_before.json), Role 2 = Junior Developer @ Nova Retail; Education = B.S. Computer Science @ University of Texas at Austin.

## D1 Bundles
Cache-busted fresh load; assert exactly index-BY8Z0Egc.js + Builder-C5u3On1S.js. Baseline storage clean before seed.

## D2 Desktop 1600: Experience labels + live personalization
Expanded Role 2 card PASS iff all 5 labels visible with exact text: "Your role at Nova Retail", "Which company was this?", "Where was Nova Retail based?", "When were you at Nova Retail?" (above the start/end pair), "What did you achieve at Nova Retail?" (above the bullets textarea). Screenshot.
Live update: type " Inc" at the end of the company input → PASS: role/location/dates/bullets labels all read "…Nova Retail Inc…" immediately (screenshot). Clear the company input entirely → PASS: labels fall back to exactly "Your role", "Where was this?", "When was this?", "What did you achieve?". Restore "Nova Retail". FAIL if any label static, stale, or missing.

## D3 Label→input focus (htmlFor)
Click the "Your role at Nova Retail" label text → PASS: document.activeElement is input#exp-{id}-role (visible focus in role input). Click "When were you at Nova Retail?" label → PASS: activeElement is the START MonthYearField input (#exp-{id}-start), not the end input; the date-picker popover may open (R124 popover regression: verify it renders correctly). FAIL if focus goes nowhere/end input.

## D4 Education labels
Expanded Education 1 PASS iff labels: "Degree and major", "Where did you study?", "Where is University of Texas at Austin located?", "When did you study?". Edit school to "MIT" → location label reads "Where is MIT located?". Restore.

## D5 Regressions
- Placeholders still visible: empty new role (Add role) shows placeholders "Job title", "Company", "Location", "Start (Jun 2023)" inside inputs under generic labels.
- Collapsed card: collapse Role 2 → header shows only "Role 2 — …" summary row; zero `label` elements inside the collapsed card.
- R148/R155 audit chip: expanded Role 2 header still shows ⚠ span chip with focus popover.
- Dates-missing warning: clear Role 2 start+end dates → amber "…timeline" warning appears under the grid; restore.
- R124 date-picker popover opens from the start input (covered in D3).

## D6 Mobile 375
Emulate 375 (fresh state OK). Expanded Experience card in Edit tab: PASS: labels visible and wrapped without clipping (screenshot), `scrollWidth` ≤ 375 (360 quirk OK), layout intact. FAIL on horizontal overflow or overlapping label text.

Cleanup: restore localStorage to exactly ["honestcv.clientId","honestcv.qa"]; close emulated tab, fresh desktop tab innerWidth 1600; no AI/share/payment/export/delete.
