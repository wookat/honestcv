# R183 QA plan — job-linked resume copies (index-BoJaEhCw.js / Jobs-BESLNTc_.js)

Delta: /jobs "Target my resume" no longer clobbers the draft. Saving a job auto-creates a saved copy "{title} — {company}" in folder "Job applications" (createResumeVersion), linked via PipelineEntry.resumeVersionId (setPipelineVersion). Detail button: "Target my resume" (no copy) vs "Open targeted resume" (copy exists); confirm loads copy into draft + sets activeVersionId + navigates /builder; deleted copy is recreated. Cover-letter path unchanged.

## J1 Bundles
Serve exactly index-BoJaEhCw.js; /jobs lazy chunk Jobs-BESLNTc_.js.

## J2 Target-my-resume copy flow (1440)
Seed draft targetRole "Baseline Role". Add a job on /jobs (title/company/JD). Click "Target my resume" → dialog mentions copy + "Job applications" → confirm → /builder shows job title/company/JD in Target job card; activeVersionId = new copy id; edit autosaves into copy only; pre-existing copies keep "Baseline Role".

## J3 Dashboard grouping
New copy appears under "Job applications" folder named "{title} — {company}".

## J4 Save-button auto-copy + idempotence
Save a second job without opening → copy auto-created, detail button reads "Open targeted resume", confirm dialog says opens existing copy, confirming opens same copy (no duplicate).

## J5 Status toggles
saved→applied→saved: resumeVersionId preserved, exactly one copy per job.

## J6 Deleted-copy recreation
Delete the copy on dashboard → /jobs "Open targeted resume" recreates a fresh copy, no crash.

## J7 Cover letter unchanged
Cover-letter action sets current draft target + opens cover tool (close without Generate — no AI).

## J8 Mobile 375
/jobs page + confirm dialog: no horizontal overflow.

## J9 Smoke
R182 companyInfo input, R180 Tailor dialog gate, R181 keyword filtering.

## J10 Cleanup
Remove honestcv.jobPipeline/resumeVersions/activeVersionId/resume/history/seen keys; final baseline exactly ["honestcv.clientId","honestcv.qa"]. No AI/payment/email.
