# R141 QA plan — per-entry "Hide from resume" (Experience/Education/Projects)

Code evidence (diff r140..r141): resume.ts `visibleResume()` filters `hidden` from experience/education/projects; sanitizer keeps `hidden:true` only. Builder.tsx: `shown = visibleResume(resume)` feeds ResumePreview (:5329), pdf/docx/txt/md downloads (:1081-1086), usePdfPageCount, ATS `scoreResume(shown…)`, final-check counts. Toggle buttons: ghost Button with aria-label `Hide role N from resume` / `Show role N on resume` (same for `education N`, `project N`), title "Hide from resume — kept here, left out of the resume" / "Show on resume", Eye→EyeOff icon; hidden card gets `opacity-60` + uppercase "Hidden" badge. Form inputs still render for hidden entries.

Bundles: hard refresh, assert index-BvO4doh4.js + Builder-BGy9hxjO.js.

Prep (unrecorded): load example resume (2 experience roles, 1 education); add one Project "QA Hidden Project" with unique description marker "ZZQPROJMARKER"; set honestcv.shared='1' (skip email nudge for TXT download); note baseline ATS score + "PDF export: N page".

## T1 Hide Experience (1440)
1. Precondition: preview shows both roles ("Junior Developer, Nova Retail" visible); note ATS score number.
2. Click eye button (aria-label "Hide role 2 from resume").
   PASS: role 2 vanishes from live preview instantly (preview text no longer contains "Nova Retail"); card dims (opacity-60) + "HIDDEN" badge in header; icon now EyeOff with title "Show on resume"; ATS score number CHANGES; storage `experience[1].hidden === true`; card's Job title input still editable (type a char, commits while hidden).

## T2 Hide Education + Project
1. Click "Hide education 1 from resume" → "University of Texas at Austin" gone from preview, badge+dim on card, `education[0].hidden===true`.
2. Click "Hide project 1 from resume" → "QA Hidden Project"/ZZQPROJMARKER gone from preview, badge+dim, `projects[0].hidden===true`.

## T3 Export excludes hidden
1. Download TXT (via download dropdown; use "Download anyway" if final check appears).
   PASS: ~/Downloads/jordan-reyes-resume.txt (or similar newest .txt) does NOT contain "Nova Retail", "University of Texas", "ZZQPROJMARKER"; DOES contain visible role "Brightlane".
2. PDF page count sanity: "PDF export: N page" indicator equals count computed from shown resume (record before/after hiding; must not error).

## T4 Toggle back restores
1. Click EyeOff on role 2 ("Show role 2 on resume").
   PASS: "Nova Retail" reappears in preview; badge gone, card undimmed; storage hidden flag removed/false.

## T5 Reload persistence
1. Re-hide role 2. Reload page.
   PASS: after reload card still dimmed+Hidden badge, preview lacks "Nova Retail", `experience[1].hidden===true` (sanitizer kept it).

## T6 Regression R140 undo/redo of toggle
1. Blur; Ctrl+Z → hidden flag reverts (role 2 back in preview, Redo enabled); Ctrl+Shift+Z → hidden again, preview drops it.

## T7 375px + R126 regressions
1. Emulate 375: eye toggle visible+tappable in Experience card header (h-10), no horizontal overflow (scrollWidth ≤ innerWidth); tap toggles hidden state.
2. R126: collapse role (chevron), duplicate role, delete the duplicate — all still work at 375.

## T8 Console
No app errors on zalize origin.

Cleanup: clear emulation; delete downloaded txt; restore localStorage to exactly ["honestcv.clientId","honestcv.qa"]. No share links, no AI, no payments.
