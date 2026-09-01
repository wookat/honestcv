# R188 QA plan — per-job tailoring progress on /jobs (Jobs-n31wm5KO.js / index-CQ3Mfuf5.css, index JS unchanged index-CgIGBUGL.js)

Code evidence: src/pages/Jobs.tsx — `matchTone` (≥80 emerald-100/800, ≥50 amber-100/800, else red-100/800); `tailoredMatchOf` map keyed by job id from pipeline entries with `resumeVersionId`, score = `matchScore(resumeToPlainText(visibleResume(copy.data)), job.description)`; list row chip `"Tailored · NN%"` (≥80) / `"Tailoring · NN%"`, replaces old `bg-primary/10` "NN% match" chip; detail meta span `"Targeted copy: NN% keyword match"` in text-emerald/amber/red-700. Fallback to draft-based chip when copy missing.

## P1 Bundles
Served /jobs lazy chunk is Jobs-n31wm5KO.js; CSS index-CQ3Mfuf5.css; index-CgIGBUGL.js unchanged.

## P2 Copy-based chip appears on save (1440)
Seed a minimal draft with NO JD keywords. Save a job on /jobs (auto-creates targeted copy per R183). Pass iff the saved job's row chip reads `Tailoring · NN%` or `Tailored · NN%` (tone class per threshold) and the detail meta shows `Targeted copy: NN% keyword match`; other (unsaved, All-tab) jobs still show old `NN% match` chip in `bg-primary/10 text-primary`.

## P3 % is copy-based, not draft-based, and rises with tailoring
Open the targeted copy in Builder (Open targeted resume) and stuff its skills/bullets with the job's keywords (read matched/missing from job detail); return to /jobs. Pass iff NN% increased vs P2 and — adversarial check — the *draft*-based chip values of other jobs did NOT change. If ≥80 reached: label flips to "Tailored" + `bg-emerald-100 text-emerald-800`; else assert amber/red tone matches the actual value band.

## P4 Delete copy → fallback
Delete the targeted copy on the dashboard. /jobs: pass iff the job's chip reverts to old `NN% match` (`bg-primary/10`) and detail reverts to "NN% keyword match with your resume", no console errors.

## P5 Dark mode chips
Store honestcv.theme=dark; /jobs with a tailoring chip: computed chip bg must be the remapped dark tint (oklch lightness ≈0.32, NOT stock ~0.95) with light text; screenshot.

## P6 Mobile 375
/jobs with tailoring chip: no horizontal overflow (scrollWidth === visualViewport.width), chip visible in row.

## P7 Regression smoke
R183 Target-my-resume/Open-targeted flows work (single copy, no dupes); R182 companyInfo input in Builder; R187 theme toggle cycles light→dark→system (aria-label + html.dark).

## P8 Cleanup
Baseline exactly ["honestcv.clientId","honestcv.qa"]. Zero AI calls.
