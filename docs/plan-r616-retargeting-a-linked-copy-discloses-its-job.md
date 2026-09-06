# R616 — retargeting a tracked job's linked copy is silent on both sides

## Evidence (production, bundle `index-DeDNpgVO.js`, qa/r616-evidence.cjs, 1280px)

Seed: tracked job "Site Reliability Engineer" at Globex (`qa-j1`, applied) whose `resumeVersionId`
is copy "SRE — Globex" (`qa-v1`, forJob = qa-j1, targets SRE/Globex/SRE posting).

1. /dashboard row: `… · for Site Reliability Engineer at Globex` (ATS 61/100).
2. Pencil → "Resume settings": *"Rename this copy or point it at a different job — its ATS score
   updates against the new posting."* Nothing says the copy is a tracked job's targeted resume.
3. Change Target role → "Platform Engineer", Company → "Initech", JD → Terraform posting, Save.
   No second dialog. Storage: copy now targets Platform Engineer @ Initech, `forJob` still qa-j1,
   pipeline still links qa-v1.
4. /dashboard row afterwards: `… · ATS 8/100 · for Site Reliability Engineer at Globex` — the
   note still claims the copy is *for* the Globex job while its own target says Initech.
5. /jobs?job=qa-j1 panel afterwards: `Targeted copy: 75% keyword match · Open targeted resume` —
   the job still presents the copy as its targeted resume; opening it lands the user in a builder
   whose Target job section reads Platform Engineer / Initech, and the ATS score is against Initech.
6. Same class in the builder (source, Builder.tsx ~L2827): the linked-copy note is
   `This copy is tailored to "{linkedJob.title}" at {linkedJob.company}` regardless of what the
   Target job fields below it currently say.

This is the dashboard-side twin of R591 (cover letter silently retargeted the active linked copy):
one action changes what the copy is aimed at, the pipeline link is left pointing at it, and every
label keeps reporting the old relationship as if nothing happened.

## Fix (smallest truthful change)

`copyTargetsJob(data, job)` (same company + same title or same description) already defines "the
copy's editable target still matches the job"; reuse it as the mismatch test everywhere.

1. **Resume settings dialog (Dashboard)** — when the copy is a tracked job's linked copy and the
   edited target no longer matches that job, show a note above the footer:
   *"This copy is the targeted resume for tracked job "SRE" at Globex. Saving keeps that link, so the
   job would open a copy aimed at another posting. To leave the job's copy as it is, save these
   changes as a new copy instead."* and add a **Save as new copy** button (creates a copy with the
   edited name/target/folder, no `forJob` — its job is unknown; original untouched and still linked).
   Plain **Save** still retargets in place (the user may genuinely mean it).
2. **CopyTargetNote** (dashboard rows + builder Copies rows) — linked branch appends
   `· now aimed at {role}[ at {company}]` when the copy's target no longer matches the linked job.
3. **Builder Target job section** — the linked-copy sentence adds
   *", but its target fields now point at {role}[ at {company}]"* under the same condition, so the
   note above the fields never contradicts the fields.

No behavior change for copies whose target still matches (title *or* description), so wording
tweaks to the role with the same pasted posting do not trigger it. No relinking, no data migration.

## Verify (prod, 1280 + 375)

- retarget mode: dialog shows the note + "Save as new copy"; clicking it → original copy unchanged
  (targets SRE/Globex, pipeline still links it), new copy "Platform Engineer — Initech" with the
  edited target and no forJob; job panel unchanged.
- inplace mode: plain Save → row note reads `for SRE at Globex · now aimed at Platform Engineer at
  Initech`; builder note for that copy reads the same mismatch.
- control: unlinked copy → dialog unchanged, no extra button.
- storage keys back to baseline, no console errors, no AI calls.
