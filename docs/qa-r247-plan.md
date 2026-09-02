# R247 QA plan — 'offer' pipeline status

Code evidence: src/lib/jobs.ts:24–33 — JobStatus/JOB_STATUSES = ['saved','applied','interviewing','offer','rejected'], JOB_STATUS_LABELS.offer='Offer'; src/pages/Jobs.tsx:89–94 staleDays returns null unless status is applied/interviewing; :313–317 counts seed includes offer:0; :392–411 nextStep offer branch → text "You have an offer — leave your current role on good terms." + button "Open resignation letter" → navigate('/builder?doc=resignation'); :226–235 trackedQueue groups in JOB_STATUSES order; status tabs :465, Hide chips :577, row/detail status buttons :781/:913 all derive from JOB_STATUSES; src/pages/Landing.tsx:152 "saved-to-offer pipeline". Bundles: index-pwJXzA7X.js / Jobs-BvEOsoZ5.js.

Method: production via CDP; fetch counter asserts zero /api/ai/*; live job for the primary flow, fixture pipeline injection for grouping/stale tests; screenshots (recording attempted once, known down).

## W0 Bundles
index-pwJXzA7X.js + Jobs-BvEOsoZ5.js live on /jobs.

## W1 Offer status end-to-end (primary)
Search "engineer", Save a real job. Detail pane status button group ("Track this job") shows 5 buttons Saved/Applied/Interviewing/Offer/Rejected. Click "Offer" in the detail pane → tab strip shows "Offer (1)"; row in Tracked shows status "Offer". Then set back to Saved via the ROW status control and to Offer again via the row control (both paths). All-tab "Hide:" group contains an "Offer" chip; enabling it hides the tracked job from All results; disabling restores. Screenshots.

## W2 Next-step + resignation navigation
With the job at Offer, detail pane "Next step:" shows exactly "You have an offer — leave your current role on good terms." with button "Open resignation letter"; clicking navigates to /builder?doc=resignation and the Resignation letter dialog is open (title visible). Screenshot of both.

## W3 Timeline
The status history list for the job shows an "Offer · <today's short date>" step appended after Saved; changing to Rejected appends a Rejected step (Offer step retained).

## W4 Tracked grouping + stale nudge (fixture pipeline injection)
Inject localStorage honestcv.jobPipeline with 5 entries, one per status, updatedAt/history 10 days old; reload → Tracked tab lists them in order saved→applied→interviewing→offer→rejected (row title order asserted). The 10-day-old 'applied' entry shows "No update · 10d" amber chip; the 10-day-old 'offer' entry shows NO stale chip. Screenshot.

## W5 Regression
Empty pipeline → Tracked (0), no crash. R245 repeated-skills strip renders when 2 fixture entries share tags; R243 skills filter "java" word boundary on All; R242 type select present with same options. Labelled Regression.

## W6 Landing blurb
/ landing jobs card text contains "saved-to-offer pipeline". Screenshot.

## W7 375px + dark
375×812 /jobs: tab strip (6 tabs incl. Offer), Hide chips, and detail status buttons visible with innerWidth==scrollWidth==375. Dark mode: rendered-pixel contrast of the Offer tab label (inactive) and the active Offer status button — report ratios ≥4.5. Screenshots.

## W8 Zero AI + cleanup
Fetch counter [] all round. Remove pipeline/QA state; final localStorage exactly ["honestcv.clientId","honestcv.qa"]; light theme; overrides cleared by reload. Screenshots r247_*.png; results appended below.

---

## Results (executed against production, bundles index-pwJXzA7X.js / Jobs-BvEOsoZ5.js)

- W0 PASS — index-pwJXzA7X.js + Jobs-BvEOsoZ5.js confirmed in /jobs resource entries; baseline localStorage ["honestcv.clientId","honestcv.qa"].
- W1 PASS — live "engineer" (18 rows) → Senior React Full-stack Developer tracked via detail-pane "Offer" button (5 buttons Saved|Applied|Interviewing|Offer|Rejected); tab strip Tracked (1)/Saved (0)/Applied (0)/Interviewing (0)/**Offer (1)**/Rejected (0). Row-level status control is a `<select>` (Jobs.tsx:780) with options none|saved|applied|interviewing|offer|rejected — set saved then offer via row select; history appended ["offer","saved","offer"]. All-tab Hide chips = Saved|Applied|Interviewing|Offer (1)|Rejected; enabling Offer chip hid the tracked job (18→17, job absent), disabling restored (18, present). Screenshots r247_offer_detail / r247_tracked_offer_row / r247_hide_offer.
- W2 PASS — Next step: "You have an offer — leave your current role on good terms." + "Open resignation letter" button; click → /builder, Resignation Letter dialog open. Note: URL shows /builder without ?doc=resignation because Builder intentionally strips the consumed param (Builder.tsx:814–818 history.replaceState) — by design, not a defect. Screenshots r247_nextstep_offer / r247_resignation_dialog.
- W3 PASS — timeline "Offer · Sep 2→Saved · Sep 2→Offer · Sep 2"; setting Rejected appended "→Rejected · Sep 2" (Offer steps retained). Screenshot r247_timeline.
- W4 PASS — 5 fixture entries injected in reverse order, all 10 days old → Tracked order saved→applied→interviewing→offer→rejected; row stale chips "No update · 10d" on applied+interviewing only (offer/saved/rejected none); detail pane: offer = no stale line, applied = "No update in 10 days — consider following up." Screenshots r247_grouping_stale / r247_offer_no_stale.
- W5 PASS (Regression) — empty pipeline: all-zero tabs incl. Offer (0), "Nothing tracked yet" message, no crash; R245 strip "python ×5|sql ×5"; R243 fixture skills "java" hides JS-only job, "c++" literal → Systems Dev; R242 type select options unchanged + contract → Systems Dev only. (First contract run returned 0 rows — my fixture omitted the required `type` field on two jobs; rerun with complete fixtures passed.)
- W6 PASS — landing body contains "saved-to-offer pipeline". Screenshot r247_landing_blurb.
- W7 PASS — 375×812 tabs + detail status buttons: innerWidth/scrollWidth 375/375 (list and detail); dark rendered-pixel contrast: inactive Offer (1) tab 4.97:1, active Offer status button (aria-pressed=true) 6.82:1 — both ≥4.5. Screenshots r247_375_tabs / r247_375_status_buttons / r247_dark_jobs + crops.
- W8 PASS — __aiReqs [] on every page (zero /api/ai/*); untracked via active Offer button; removed honestcv.jobPipeline / honestcv.theme / honestcv.resumeVersions (auto-created targeted copy from tracking the real job); final localStorage exactly ["honestcv.clientId","honestcv.qa"], light theme. Screenshot r247_cleanup_final.

Caveats: recording service still down (ffmpeg exits on start; attempted once). Computer-use screen tooling unavailable this round — screenshots were captured via CDP and validated programmatically (dimensions, luminance range, pixel-contrast crops) rather than eyeballed.
