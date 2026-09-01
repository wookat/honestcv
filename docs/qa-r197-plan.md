# R197 QA plan — organizational actions keep the Edited timestamp (index-B3z0zisq.js / Dashboard-CR_6BhTm.js)

Code evidence: src/lib/resume.ts L1196-1209 — updateResumeVersion bumps updatedAt only when patch.data present AND JSON differs from v.data; renameResumeVersion L1190-1194 never bumps. Dashboard.tsx: editedAgo L85-89 ("Edited N days ago"), moveVersionTo L258-262 (patch {folder}), renameFolder L265-268 / removeFolder L276-279 (folder patches), sort L294-297 (default = updatedAt desc), Resume settings dialog Save L1404-1429 (patches name+folder+data with target fields — unchanged fields ⇒ identical JSON ⇒ no bump under R197; old code always bumped). Builder autosave path syncActiveVersion (resume.ts L1262) always bumps.

## E1 Bundles
index-B3z0zisq.js entry; /dashboard loads Dashboard-CR_6BhTm.js.

## E2 Setup + recency baseline (1440)
Create 3 copies via Builder "Save as copy". Backdate copy A's updatedAt to now-10d in honestcv.resumeVersions. Dashboard shows "Edited 10 days ago" on A; default sort lists A last (others "Edited today" first).

## E3 Move to folder (core)
Use A's row "Move to folder" button → create/select folder "QA". Assert: A's card still reads "Edited 10 days ago" (NOT "Edited today"), stored updatedAt is exactly the backdated ms, and A stays last in Recently edited order. (Broken/old code would show "Edited today" and move A first.)

## E4 Folder rename + remove (R171)
Rename folder "QA"→"QA2" via pencil dialog → A's updatedAt unchanged, text still "Edited 10 days ago". Remove folder via trash dialog "Remove folder" → A unfoldered, updatedAt unchanged.

## E5 Resume settings dialog
Open A's edit dialog, change ONLY the name, Save → updatedAt unchanged ("Edited 10 days ago", stored ms identical). Reopen, change Target role, Save → updatedAt bumps to now ("Edited today", A first in sort).

## E6 Builder content edit (regression)
Re-backdate A 10d, open A in Builder (confirm dialog), type into a field → autosave → back on dashboard A shows "Edited today" (syncActiveVersion bump intact).

## E7 R183 targeted-copy smoke (regression)
On /jobs, save a job → "Target my resume" flow creates linked copy; copy appears on dashboard "Edited today".

## E8 Dark + 375 + cleanup
One dark dashboard screenshot, one 375px (scrollWidth === visualViewport.width). Zero AI generation calls; final localStorage exactly ["honestcv.clientId","honestcv.qa"].

## Results (executed on production)
- E1 bundles — passed. E2 baseline "Edited 10 days ago" + sort — passed.
- E3 move to folder: updatedAt bit-identical, "Edited 10 days ago" kept, order unchanged — passed.
- E4 folder rename QA→QA2 and remove: updatedAt unchanged both times — passed.
- E5a rename-only / untouched dialog save: **FAILED (P2)** — every Resume settings save bumps updatedAt when the copy's experience level is unset (the default). Root cause: dialog Save patches `data.experienceLevel = ''` (Dashboard.tsx L1419) but sanitizeResume maps `''` → undefined (resume.ts L1091-1094 asEnum without `''`), so `JSON.stringify(patch.data)` ('"experienceLevel":""') never equals sanitized `v.data` (key dropped) → contentChanged always true. Proven: untouched saves bumped twice in a row; after setting level to Senior, rename-only save no longer bumps (updatedAt preserved, "Edited 10 days ago" kept).
- E5b target-role change bumps to "Edited today" — passed.
- E6 Builder content edit → autosave bump — passed. E7 R183 targeted copy create/link — passed.
- E8 dark legible, 375 no overflow, zero AI calls, baseline restored — passed.
Suggested fix: sanitize/normalize patch.data before comparing (compare JSON.stringify(sanitizeResume(patch.data)) vs v.data), or include '' in the asEnum allowed list / omit empty experienceLevel in the dialog patch.

## Fix re-verification (index-3pI0ilHM.js / Dashboard-NlTo6YUu.js)
Code: resume.ts updateResumeVersion now compares JSON.stringify(sanitizeResume(patch.data)) vs JSON.stringify(sanitizeResume(v.data)) (commit 2723c30).
- F1: entry index-3pI0ilHM.js served; /dashboard loads Dashboard-NlTo6YUu.js.
- F2 (original failure): copy with experience level UNSET (dialog level select value ''), backdated 10d → untouched dialog Save keeps updatedAt bit-identical + card "Edited 10 days ago"; then rename-only Save also keeps both.
- F3 (over-fix guard): change Target role → updatedAt bumps to now, card "Edited today", copy first in sort.
- F4 smoke: Move to folder keeps updatedAt/card text.
- Cleanup: localStorage baseline ["honestcv.clientId","honestcv.qa"]; zero AI calls. Screenshots r197_fix_*.

### Fix re-verification results
- F1 bundles index-3pI0ilHM.js / Dashboard-NlTo6YUu.js — passed.
- F2 copy with unset level (dialog level value ''), backdated 10d: untouched dialog Save AND rename-only Save both keep updatedAt bit-identical, card stays "Edited 10 days ago" — passed (original P2 fixed).
- F3 Target role change → bumps to now, "Edited today" — passed (no over-fix).
- F4 Move to folder (FixQA) keeps updatedAt/"Edited 10 days ago" — passed.
- Zero AI calls; baseline restored — done.
