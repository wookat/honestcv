# R196 QA plan — Tracked overview tab on /jobs (index--QCj_i0f.js / Jobs-FWJgWasl.js)

Code evidence: src/pages/Jobs.tsx — trackedQueue L190-199 (JOB_STATUSES.flatMap, per-group updatedAt desc), base branch L200-205, tab button L401 `Tracked (${pipeline.length})`, group header L548-552 (`bg-muted/60` p when tab==='tracked' && status !== previous row's status, text `{Label} ({counts[status]})`), empty state L532-533, search form All-only L424, Hide row All-only L482.

## T1 Bundles
index--QCj_i0f.js entry; /jobs loads Jobs-FWJgWasl.js.

## T2 Seeded queue (1440)
Save 2 jobs via UI, then seed honestcv.jobPipeline to 5 entries: 2 saved (updatedAt now and now-2d), 1 applied (backdated 9d, 2 history steps + notes), 1 interviewing (now-1d), 1 rejected (now-3d). Reload.
Assert: tab labeled exactly `Tracked (5)`; clicking it shows headers in order `Saved (2)`, `Applied (1)`, `Interviewing (1)`, `Rejected (1)`; exactly 4 headers (no zero-count header — verify by later removing a group); within Saved the newer-updatedAt job listed first; rows show R194 recency + stale pill (`No update · 9d` on applied) and R192 toggle labels. Search input / sort select / Hide row absent on Tracked tab.

## T3 Live status move
On Tracked tab, use the applied row's status select → Interviewing. Assert row moves under `Interviewing (2)` header immediately, `Applied` header disappears (count 0 → no header), tab label stays `Tracked (5)`. Move back to Applied for T4.

## T4 Untrack guard from Tracked tab
Click the applied entry's row toggle "Tracked" (entry has ≥2 steps + notes). Assert R191 dialog `Stop tracking "…"?` opens; Cancel → entry intact.

## T5 Row click → detail pane
Click a tracked row: detail pane shows R190 Application timeline and R193 "Next step:" row.

## T6 Empty state + All-tab regression
Clear pipeline → Tracked tab shows "Nothing tracked yet — use the status buttons on a job to track it." and `Tracked (0)`. Regression: on All, type "Europe" → R195 divider `Open to any location (N)` still renders; per-status tabs (Saved) unchanged, no group headers there.

## T7 Dark + 375
Dark mode: group headers legible (computed styles). 375px with seeded queue: scrollWidth === visualViewport.width.

## T8 Cleanup
Zero AI generation calls; final localStorage exactly ["honestcv.clientId","honestcv.qa"].
