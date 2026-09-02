# R192 QA plan — row track-toggle button on /jobs (index-Cxg01ohm.js / Jobs-BYbM3U0d.js)

Code evidence: Jobs.tsx:507-518 diff — row button now aria-pressed={status!==undefined}, label: untracked→"Save", saved→"Saved", any other status→"Tracked", both tracked states get `border-primary ring-primary/40 ring-2`; onClick = setStatus(j, status ? 'none' : 'saved') — i.e. tracked click requests untrack (routes through R191 guard), never demotes to saved / never writes a timeline step.

## V1 Bundles
index-Cxg01ohm.js entry; Jobs-BYbM3U0d.js chunk.

## V2 Core: Save → Tracked → guard → Cancel → Confirm (1440)
Save job (row button "Save" → becomes "Saved" pressed ring). Row select → Applied → row button now reads "Tracked" with aria-pressed=true + ring classes (NOT "Save"/"Saved"). Add notes. Click "Tracked" → R191 dialog `Stop tracking "..."?` appears. Cancel → button still "Tracked", history unchanged (["saved","applied"]), notes intact. Click again → Confirm "Stop tracking" → entry removed, button reverts to "Save" aria-pressed=false.

## V3 Key regression assertion (the R191 stray-click bug)
Adversarial: with the job at Applied, click the row button once (opens dialog), Cancel; verify honestcv.jobPipeline history contains NO 'saved' step appended after 'applied' (exactly ["saved","applied"]) and status stays 'applied'. Fail if any demotion step or status change occurs.

## V4 saved-only immediate untrack
Fresh save (1 step, no notes): click "Saved" → immediate untrack, no dialog (R191 unchanged).

## V5 Dark + 375
Dark: "Tracked" pressed button legible (screenshot). 375: no overflow, row button height ≥40px (min-h-10; sm:min-h-7 means ≥28px at desktop — assert 40 at 375 only).

## V6 Light regression
R190: timeline accrues via pane/select, notes save; R191: pane re-click + select→No status still dialog; R188 Tailoring chip in list.

## V7 Cleanup
Zero AI; final localStorage exactly ["honestcv.clientId","honestcv.qa"].
