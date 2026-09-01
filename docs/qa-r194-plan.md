# R194 QA plan — stale-application nudge on /jobs (index-oBnYGFgb.js / Jobs-lEJNw1S4.js)

Code evidence: Jobs.tsx staleDays() (lines 88–94: only applied/interviewing; last timelineOf step ≥7d), row chip render ~557–575 (recency `{Status} N days ago` text-primary now WITHOUT `tab !== 'all'` gate; amber pill `No update · Nd` bg-amber-100 text-amber-800), detail line ~775–785 (`No update in N days — consider following up.` text-amber-700, after timeline `<ol>`, before Notes label).

## S1 Bundles
index-oBnYGFgb.js entry; Jobs-lEJNw1S4.js chunk.

## S2 All-tab recency (key delta vs R193)
Save job A (saved), job B → Applied. On the ALL tab: both rows show "Saved/Applied N days ago" (text-primary). Fail if absent on All (old behavior). Status tabs still show it.

## S3 Stale applied/interviewing
Edit honestcv.jobPipeline: job B (applied) → updatedAt and last history step at = now-9d. Reload. Row (All + Applied tabs): amber pill exactly "No update · 9d"; detail pane under timeline: "No update in 9 days — consider following up." (amber). Switch B to interviewing with last step backdated 9d → same nudge appears.

## S4 Negative states (adversarial)
- Job A saved, backdate its only step to now-30d → NO amber pill/line (status gate), but recency "Saved 30 days ago" still shows.
- Rejected entry backdated 9d → NO nudge.
- Fresh applied (today, <7d) → recency "Applied today/0 days" but NO pill and NO detail line.

## S5 Dark + 375
Dark: amber pill and detail line legible on dark card (screenshot + computed colors). 375: scrollWidth===visualViewport.width with a stale row visible.

## S6 Regression
Stale applied entry: R193 "Next step: Prepare for the interview…" row coexists with the nudge in the same card. R190 timeline/notes intact; R191 guard fires on Tracked click; R192 row label "Tracked"; R188 chip present for copy-linked job.

## S7 Cleanup
Zero AI generation calls; final localStorage exactly ["honestcv.clientId","honestcv.qa"].
