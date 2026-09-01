# R193 QA plan — Next step row on /jobs detail pane (index-DnHdzYZ3.js / Jobs-qjYXZcnn.js)

Code evidence: Jobs.tsx nextStep() (diff vs R192, lines ~272-335) + render at top of bg-muted/40 box with `border-b` divider, Lightbulb icon `text-primary size-4`, "Next step:" bold prefix, outline Button `min-h-10 sm:min-h-7`; href case renders `<a target="_blank" rel="noopener noreferrer">` with ExternalLink icon.

## N1 Bundles
index-DnHdzYZ3.js entry; Jobs-qjYXZcnn.js chunk.

## N2 Six states (1440), each: exact text + button label + action
1. saved fresh (copy 0% <80): "Improve your targeted copy — 0% keyword match." + "Open targeted resume"; click → navigates to /builder with the copy open (fail if draft resume instead — verify honestcv.activeVersionId == entry.resumeVersionId).
2. saved with copy ≥80%: paste all missing keywords into copy's #skills → back on /jobs text "Your copy is well tailored — apply while the posting is open." + "Apply on site" anchor: href == entry.job.url, target=_blank, rel noopener noreferrer (do not load external site).
3. applied: "Prepare for the interview while the application is fresh." + "Open interview prep"; click → URL /builder?doc=interview, interview dialog opens, draft targetRole/targetCompany/jobDescription == job's (check honestcv.resume). NO AI run — close dialog.
4. interviewing: "Practice interview questions before the next round." + same button (label identical; text differs).
5. rejected: "Keep momentum — look for similar roles." + "Search similar jobs"; click → tab switches to All, search input value == job title, results rerun.
6. tracked but no copy: delete linked copy via dashboard "Delete this copy" → back on /jobs "Create a resume targeted at this job." + "Target my resume"; click → R183 confirm dialog opens (cancel it).
Untracked job: NO "Next step:" row.

## N3 Dark + 375
Dark: Next step row legible (Lightbulb primary tint). 375: scrollWidth===visualViewport.width; button height 40px (min-h-10), desktop 28px.

## N4 Regression
R192 Save/Saved/Tracked toggle labels; R191 dialog on tracked-click; R190 timeline chips + notes; R188 Tailoring chip.

## N5 Cleanup
Zero AI calls (interview dialog opened but no generation); final localStorage exactly ["honestcv.clientId","honestcv.qa"].
