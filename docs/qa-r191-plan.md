# R191 QA plan — untrack confirm guard on /jobs (index-DIVPblde.js / Jobs-CmB6_Bhl.js)

Code evidence: Jobs.tsx diff (origin/devin/1788285287-r191-untrack-guard): setStatus(job,'none') now guards — if entry has notes?.trim() OR timelineOf(entry).length>1 → setConfirmUntrack(job) and early-return (no removal); else immediate removeFromPipeline. Dialog: DialogTitle `Stop tracking "{title}"?`; description `This removes the job from your pipeline and deletes {parts} . Targeted resume copies stay on your dashboard.` with parts = "its application timeline (N status changes)" (if steps>1) and/or "your notes"; footer Cancel (outline, min-h-10) + destructive "Stop tracking" (min-h-10). All three untrack paths route through setStatus: detail-pane active-status button re-click (line 623), row Saved toggle (505), row select value 'none' (516).

## U1 Bundles
index-DIVPblde.js entry; Jobs-CmB6_Bhl.js chunk on /jobs.

## U2 Notes entry → dialog on all 3 paths + Cancel intact (1440)
Save job A, set Applied (2 steps), add notes "Recruiter Dana". Path① detail-pane re-click "Applied" → dialog title `Stop tracking "<A title>"?`, description mentions BOTH "its application timeline (2 status changes)" and "your notes" and "Targeted resume copies stay"; Cancel → entry intact (timeline 2 chips, notes textarea text, storage unchanged). Path② row select → "No status" → dialog; Cancel → select still shows Applied. Path③ (Saved-toggle applies to saved-status rows; covered in U3 variant). Fail if removal happens without dialog or Cancel loses data.

## U3 Timeline-only (≥2 steps, no notes) → dialog mentions timeline only
Job B: save + Applied, no notes. Untrack via row Saved-path variant (set back to saved first? Simpler: row select 'No status') → dialog description contains "(2 status changes)" and NOT "your notes".

## U4 Confirm Stop tracking
On job A dialog, click destructive "Stop tracking" → entry removed (row chip/status cleared, tab counts decrease, storage entry gone); R183 targeted copy still exists in honestcv.resumeVersions and on dashboard.

## U5 No-data paths → immediate delete, no dialog
Fresh save (1 step, no notes) → row Saved toggle click → immediately untracked, no dialog. Hand-injected pre-R190 entry {job,status:'applied',updatedAt} (no history/notes → synthesized 1 step) → select 'No status' → immediate removal, no dialog.

## U6 Status switching never dialogs + regression
saved→applied→interviewing transitions: no dialog, timeline accrues (R190); R188 Tailoring chip on fresh save.

## U7 Dark + 375
Dialog with honestcv.theme=dark legible (screenshot); at 375px: dialog fits (scrollWidth===visualViewport.width), Cancel + Stop tracking buttons height ≥40px (min-h-10).

## U8 Cleanup
Zero AI; final localStorage exactly ["honestcv.clientId","honestcv.qa"].
