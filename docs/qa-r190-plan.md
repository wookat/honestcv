# R190 QA plan — /jobs application tracking (index-CEvswqKA.js / Jobs-8ZzDZfGB.js)

Code evidence: src/lib/jobs.ts (history: StatusChange[] appended by upsertPipeline only on actual status change; notes preserved across upserts; setPipelineNotes stores undefined for blank; timelineOf synthesizes [{status,updatedAt}] for pre-R190 entries). src/pages/Jobs.tsx: detail-pane box `div.bg-muted/40` with "Application timeline" heading, `<ol>` chips "Label · MMM D" separated by "→", last step `bg-primary/10 text-primary`; `textarea#job-notes` saved on blur (placeholder "…saved in this browser only."); row StickyNote icon `aria-label="Has notes"` when entry.notes non-blank.

## T1 Bundles
Entry index-CEvswqKA.js; /jobs chunk Jobs-8ZzDZfGB.js.

## T2 Timeline accumulation (1440)
Save a job → detail box shows exactly one chip "Saved · <today short date>" with bg-primary/10. Click Applied → 2 chips "Saved · d → Applied · d", last highlighted, first muted. Click Interviewing → 3 chips in order. Re-click Interviewing → still 3 steps (no dup; verify via UI chip count and honestcv.jobPipeline history length). Fail if count wrong, order wrong, or highlight not on last.

## T3 Notes persistence + icon
Type "Recruiter: Dana; onsite Sep 12" into #job-notes, blur, reload /jobs → textarea repopulated; pipeline tab row for the job shows StickyNote (aria-label="Has notes"); screenshot. Clear notes to empty, blur, reload → icon gone, honestcv.jobPipeline entry has no notes key.

## T4 Backward compat (pre-R190 entry)
Seed honestcv.jobPipeline with an entry {job, status:'applied', updatedAt: <past>} lacking history/notes, reload → detail shows one-step timeline "Applied · <date>" (from updatedAt), no console errors. Change status to Interviewing → timeline shows 2 steps (synthesized Applied + new Interviewing), history in storage has 2 entries.

## T5 Untracked
Job with "No status": no "Application timeline"/Notes box. Toggle status off on a tracked job → box disappears.

## T6 Dark + 375
honestcv.theme=dark: timeline chips + notes textarea legible; 375px: scrollWidth === visualViewport.width with box rendered.

## T7 Regression smoke
R188 Tailoring/Tailored chip on saved job with copy; R189 /ats-checker DOCX upload shows "Uploaded file checks".

## T8 Cleanup
Zero AI calls; final localStorage exactly ["honestcv.clientId","honestcv.qa"].
