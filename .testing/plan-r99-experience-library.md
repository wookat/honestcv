# R99 — Experience library (bundle index-DXxQqK1v.js, commit a71c9cd, ZERO AI)

Code: resume.ts listExperienceLibrary/saveExperienceToLibrary/deleteLibraryExperience on key `honestcv.experienceLibrary` (cap 30, loader drops entries missing id / non-number savedAt / empty data). Builder.tsx: per-role ghost BookmarkPlus (between Duplicate and Delete, title "Save role to library — reuse it in other resume copies", disabled when role+company+bullets empty, Check flash 1600ms); "From library (n)" outline button next to Add role, hidden when empty; inline "Saved roles" panel with "role — company" + Saved date, Insert (appends copy with new id, filters fully-empty placeholders) and red Trash.

Setup: backup → qa.r99.backup, clear, qa=1, shared=1, reload (verify bundle DXxQqK1v), load example. Record.

## T1 Fresh state + disabled logic
- No "From library" button next to Add role (only Add role). Bookmark on stock role enabled; click "Add role" → new empty role's bookmark disabled (verify computed disabled attr + pixels). Remove empty role after (or leave; Insert-filter test uses it later).

## T2 Save → flash → panel → persistence
- Click bookmark on role 1 (Software Engineer — Brightlane). PASS: icon swaps to green Check then back within ~1.6s (screenshot during flash); "From library (1)" button appears; panel toggles open showing "Software Engineer — Brightlane" + "Saved <today>"; localStorage `honestcv.experienceLibrary` = 1 entry with id, numeric savedAt, data w/ role/company/bullets; F5 → button still shows (1).

## T3 Insert into different resume
- Reset content: change resume (delete both stock roles, leaving auto empty placeholder OR use fresh blank resume state). Open panel → Insert. PASS: role appended with all fields (role/company/location/dates/bullets byte-equal to saved data), NEW id ≠ source role id and ≠ library data.id; the fully-empty placeholder role is removed (count = 1 role, not 2).

## T4 Delete from panel
- Click red trash in panel. PASS: row gone; library empty → "From library" button disappears entirely; localStorage array [].

## T5 Hardening (CDP injection + reload)
- Set key to `not json` → reload → no console errors, no From-library button.
- Set to JSON: [valid, {no id}, {savedAt:"x"}, {id,savedAt,data:{}} (empty), {id,savedAt,data:{role:'Keeper'...}}] → reload → button shows (2), panel lists only the 2 valid.
- Cap: inject 30 valid entries → save a role via bookmark → localStorage length stays 30, newest (just-saved role) first.

## T6 375px
- CDP hold 375×812: bookmark + Insert + trash buttons rect height ≥40px (h-10 on mobile); panel rows within viewport, scrollWidth=375, scrollX=0.

## T7 Regression + hygiene + cleanup
- Duplicate role and Delete role buttons still work (count changes); R97 skills preview bold labels intact (spot check).
- Instrumented reload: console clean (merriweather benign), APIs billing/quota(/hit) only, zero failed, zero non-quota /api/ai/*.
- Restore localStorage byte-for-byte (diffs:[], extra:[], qa.r99.backup deleted, honestcv.clientId f597bb49-, resume 1685B, no honestcv.experienceLibrary key left), stop mobile hold, desktop metrics, final reload → Jordan Reyes ATS 88.
