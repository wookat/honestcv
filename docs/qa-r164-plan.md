# R164 QA plan — "Explore skills" guided skill suggestions (PR #379, bundles index-BUDYkwVf.js / Builder-i3elPhvd.js)

Code evidence (diff df3d7f8~1..df3d7f8):
- Builder.tsx ~L4922: Skills-section "AI suggest related skills" button now opens `skillExploreSetup` dialog instead of calling runSkillSuggest directly.
- Dialog ~L6470: title "Explore skills"; `#skill-explore-context` Input (placeholder "e.g. built React dashboards", maxLength 200, Enter submits); `#skill-explore-category` select with options ["", "hard skills", "soft skills", "tools and software", "languages"] labeled Any kind of skill / Hard skills / Soft skills / Tools & software / Languages; "Suggest skills" button closes dialog → runSkillSuggest(context, category).
- runSkillSuggest ~L1272: client guard now passes if context non-empty even with empty skills+role; error text updated to "Add a target role, a few skills, or describe what you did — suggestions build on what you already have."
- worker/index.ts: same 400 guard/relaxation server-side; context/category forwarded into prompt.
- Result chips path unchanged: `aiSkillChips` render below Skills; static fallback `skillSuggestionsFor(targetRole)` at L5010 when aiSkillChips null; tapping a chip appends to skills textarea + dedupes.
- freeRemaining is null for QA clients — do NOT assert on quota badge.

## J1 Bundles
Cache-busted fresh load → exactly index-BUDYkwVf.js + Builder-i3elPhvd.js; baseline storage clean.

## J2 Dialog + old behavior with empty fields (1440) — primary
Seed standard fixture (role + skills present). Click "AI suggest related skills" in Skills section.
PASS iff: "Explore skills" dialog appears (NO immediate AI call — screenshot); context input empty with placeholder, select shows "Any kind of skill" and exactly the 5 documented options. Click "Suggest skills" with both fields empty → dialog closes, AI runs, result chips render below the Skills textarea and none duplicates an existing skill (old behavior reproduced).

## J3 Context + category flow + chip tap
Reopen dialog; type "built React dashboards" into #skill-explore-context, select "Tools & software", click "Suggest skills".
PASS iff: chips returned are plausible tool/software names related to React dashboards (AI leniency: majority look like tools/libraries); tap one chip → its text is appended to the skills textarea (storage check) and the chip disappears from the list.

## J4 Empty resume: context unlocks suggestions; all-empty shows guidance error
Seed resume with targetRole='' and skills='' (keep some experience).
- Open dialog, click "Suggest skills" with everything empty → PASS iff the inline error appears with exact text "Add a target role, a few skills, or describe what you did — suggestions build on what you already have." and NO chips render.
- Reopen, type "organized community fundraising events", submit via Enter key → PASS iff suggestions come back (no 400 error; chips render). (Enter-submit also covered here.)

## J5 Regression (desktop)
- R163: empty summary → "Draft from my resume" still opens the "Draft my summary" dialog (presence only, no AI call).
- "AI clean up skills" button still present/clickable (do not consume unless quick).
- Static fallback: with aiSkillChips null (fresh reload) and a known targetRole, the non-AI suggestion chips from skillSuggestionsFor render under Skills unchanged.

## J6 Mobile 375
Emulate 375, open Explore skills dialog → PASS iff dialog right edge ≤375, context input + select usable (focusable, full width), `scrollWidth ≤ 375`. Screenshot.

Cleanup: restore localStorage to exactly ["honestcv.clientId","honestcv.qa"]; fresh desktop tab; AI quota use allowed; no share/payment/export/deletion.
