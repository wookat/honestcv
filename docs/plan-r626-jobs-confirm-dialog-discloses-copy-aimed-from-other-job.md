# R626 — K's "Target my resume" / "Cover letter" dialogs mint a copy from the draft while a copy aimed at K already exists

## Evidence (production `index-jJDnduxS.js`, `qa/r626-evidence.cjs`)

Copy A (content, tailored) is linked to tracked job J but its Target job now matches tracked job K.
K's card "Next step" says (R623) *""SRE — Globex" is aimed at this job but is linked to "Site
Reliability Engineer" at Globex." — Open it to save a copy for this job*. But the card's primary
buttons ignore that:

- **Target my resume**, empty editor → *"Your resume is still empty, so there's nothing to copy yet.
  This aims your draft at this posting…"* — **Start my resume for this job**. Untrue in spirit: a
  tailored resume aimed at this job exists; the user is sent to write one from scratch.
- **Target my resume**, unrelated unsaved draft → *"This saves a copy of your resume targeted at this
  posting…"* — **Create copy and open editor**: mints a second copy for K from a different resume.
- **Cover letter**, empty editor → *"This sets the job title and description on your current draft…"*:
  the letter is generated from an empty resume although A exists.

R625 fixed J's side of the same dialog (linked copy that left); K's side still does not know about A.

## Fix (Jobs.tsx)

When `!targetedCopyOf(job)` and `copyAimedFromOtherJob(job)` = `{ copy: A, job: J }` (intents
`target` / `cover`):

- Description is prefixed with *""A" is aimed at this job but is linked to "J" at Globex — "Open that
  copy" opens it so you can save a copy for this job from its Target job section[, saving your draft
  as a copy first]. Otherwise: "* + the existing sentence for the primary action.
- New outline button **Open that copy** → `openAimedCopy(job, A, intent)`:
  `keepDraftAsCopy()` if a standalone draft with content would be replaced; `saveResume(A.data)`,
  `setActiveVersionId(A.id)`; navigate to `/builder?jump=target` (target — R622 offers "Save as new
  copy for it" there) or `/builder?doc=cover&company=K&job=K` (cover — R624 resolves the letter to K
  because A targets K, so the letter is written for and linked to K; J's resume link is untouched).
- Primary button and its behaviour unchanged (the user may still want a fresh copy).

Controls: A still targets J (nothing aimed at K), orphan copy for K, linked copy for K — unchanged.

## Acceptance

- 1280 + 375, K's card: both dialogs show the disclosure and **Open that copy**; clicking it → editor
  active = A, J→A link intact, K unlinked; target path shows R622 "Save as new copy for it"; cover
  path opens the tool with company Initech, no retarget notice, Save links to K. Draft variant: the
  draft is saved as a copy first.
- Control: dialog texts unchanged, no extra button.
- No overflow, 0 console errors, no AI calls, localStorage restored.
