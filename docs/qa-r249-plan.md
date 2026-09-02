# R249 QA plan — bulk actions on the /jobs Tracked tab

Code evidence: src/lib/jobs.ts:175–184 updateStatuses (single write; skips same-status entries; appends {status,at} via timelineOf; keeps positions), :187–190 removeManyFromPipeline; src/pages/Jobs.tsx:123–125 bulkMode/bulkIds/confirmBulkUntrack, :619–637 bulk bar `role=group aria-label="Bulk actions on tracked jobs"` shown when tab===tracked && pipeline.length>0, "Select…"/"Done selecting" toggle with aria-pressed, :638–657 "N selected" + Move-to select (aria-label "Move selected jobs to a status", value stays ""), :763–780 per-row checkbox `aria-label="Select <title> at <company>"` as flex sibling, :1225–1257 confirm dialog "Stop tracking N jobs?" → removeManyFromPipeline. Bundles: index-0nsNYAcI.js / Jobs-BTCTo9vu.js.

Method: production via CDP (suppress_origin=True); deterministic honestcv.jobPipeline fixture of 5 entries (saved/applied/interviewing/offer/rejected; jobs include type+category+tags; one entry with notes + 3-step history); byte-compare pipeline JSON before/after where specified; fetch counter asserts zero /api/ai/*; screenshots (recording known down, attempted once).

Fixture: entries f1..f5 with statuses saved/applied/interviewing/offer/rejected; f2 (applied) has notes "Recruiter: Sam" and history [saved,applied,interviewing→? no] → use history [{saved},{applied}] plus f4 (offer) history [{saved},{interviewing},{offer}]; shared tags ["python","sql"] on ≥2 entries for the R245 strip.

## Y0 Bundles
index-0nsNYAcI.js + Jobs-BTCTo9vu.js live on /jobs; bulk bar absent on All tab and (with pipeline cleared) on Tracked.

## Y1 Bulk move (primary)
Tracked tab → click "Select…" (aria-pressed true, label "Done selecting") → 5 checkboxes with exact aria-labels. Check f1 (saved), f2 (applied, has notes/history), f5 (rejected) → bar shows "3 selected", Move-to select + "Untrack 3" + "Clear" visible. Choose "Rejected" in Move to… → expected pipeline: f1 status rejected, history [saved,rejected(now)]; f2 status rejected, history [saved,applied,rejected(now)], notes preserved; f5 **byte-identical** to before (same-status skip); f3/f4 untouched; f1/f2 updatedAt refreshed and equal; entries keep positions in stored array; tab counts Rejected (3), grouping updates; selection cleared (no "N selected"), Move select back to placeholder. Screenshots before/after.

## Y2 Move to current status = no-op
Select f3 (interviewing) + f4 (offer)? No — same-status only guard is per-entry; instead select f5 + f1 + f2 (all now rejected), Move to "Rejected" → stored pipeline JSON **byte-identical** (===) to before; no duplicate history steps.

## Y3 Bulk untrack + cancel
Select f1+f2 → "Untrack 2" opens dialog titled "Stop tracking 2 jobs?"; Cancel → pipeline byte-identical, selection preserved(?) assert actual behavior; then Untrack 2 → confirm "Stop tracking" → only f1/f2 removed; f3/f4/f5 survive with notes/history intact (byte-compare survivors); counts update; selection cleared.

## Y4 Row interactions in bulk mode
Checkbox click does NOT change the selected detail pane (selectedId unchanged, no mobile detail); clicking the row title button still opens the detail pane; per-row status `<select>` still changes one job's status while bulk mode active.

## Y5 Selection/bulk-mode reset
With 1 selected: switch to All tab → back to Tracked → bulk mode off (button "Select…", no checkboxes). Re-enter, select 1, click "Done selecting" → checkboxes gone; re-toggling shows 0 selected (bar actions hidden at 0).

## Y6 Regression
R247: f4 (offer) detail shows "You have an offer — leave your current role on good terms." + "Open resignation letter"; stale nudge on a 10-day-old applied entry still shows, offer not. R245: "Repeated skills:" strip renders above the list while bulk mode on. R244: detail Skills chips render for a tagged entry.

## Y7 375px
375×812 Tracked with bulk mode on + 2 selected (bar + checkboxes): document.documentElement.scrollWidth === 375. Screenshot.

## Y8 Dark contrast
Dark via UI toggle; rendered-pixel contrast (crops with scrollX/scrollY-corrected clips): "Select…"/"Done selecting" toggle text and "Untrack N" destructive text — report ratios (target ≥4.5). Screenshots + crops.

## Y9 Zero AI + cleanup
Fetch counter [] on all loads. Remove honestcv.jobPipeline (+theme etc.); final localStorage exactly ["honestcv.clientId","honestcv.qa"]; light theme. Screenshots r249_*.png; results appended below.

## Results (executed on production, CDP; recording service down — attempted once)
- Y0 bundles index-0nsNYAcI.js / Jobs-BTCTo9vu.js live; bulk bar absent on All tab and on empty-pipeline Tracked — PASS
- Y1 bulk move: toggle "Select…"→aria-pressed=true→"Done selecting"; 5 checkboxes exact labels "Select Fixture N <status> at FxCo"; 3 selected → "3 selected", Move-to select (value ""), "Untrack 3", "Clear"; Move→Rejected: f1 hist [saved,rejected], f2 hist [saved,applied,rejected] notes preserved, f1/f2 updatedAt refreshed+equal, f5 (already rejected) byte-identical, f3/f4 byte-identical, order f1..f5 preserved, tabs Rejected (3), selection cleared — PASS
- Y2 same-status move (f1,f2,f5 all rejected → Rejected): pipeline JSON byte-identical, selection cleared — PASS
- Y3 untrack: dialog "Stop tracking 2 jobs?"; Cancel → pipeline byte-identical (selection preserved after cancel); confirm → only f1,f2 removed, survivors f3/f4/f5 byte-identical (notes/history intact), Tracked (3), selection cleared — PASS
- Y4 checkbox click doesn't open detail pane; row title click opens detail (Fixture 4); per-row status select works in bulk mode (f5 rejected→saved, hist appended) — PASS
- Y5 tab switch resets bulk mode+selection; "Done selecting" removes checkboxes; actions hidden at 0 selected; "Clear" empties selection but keeps bulk mode — PASS
- Y6 regression: offer next-step text + "Open resignation letter"; Repeated skills strip (python ×3|sql ×3) renders in bulk mode; stale nudge on 10d interviewing only (offer f4 exempt); R244 python/sql detail chips — PASS
- Y7 375×812 Tracked, bulk mode + 2 selected: scrollWidth 375 — PASS
- Y8 dark contrast: "Done selecting" toggle 13.49:1, "Untrack 2" 4.95:1 — PASS
- Y9 __aiReqs [] (only baseline GET /api/ai/quota, no completions); final localStorage exactly ["honestcv.clientId","honestcv.qa"]; light theme — DONE

Screenshots: /home/ubuntu/screenshots/r249_bulk_mode_on.png, r249_3selected.png, r249_after_move.png, r249_untrack_confirm.png, r249_after_untrack.png, r249_detail_in_bulk.png, r249_strip_bulk.png, r249_375_bulk.png, r249_dark_bulk.png (+_toggle_crop/_untrack_crop), r249_regressions.png, r249_cleanup_final.png
