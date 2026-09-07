# R627 — K's "Open interview prep" ignores the copy aimed at K and runs the brief from an empty draft (or silently mints a copy)

## Evidence (production `index-DZGv7gC9.js`, `qa/r627-evidence.cjs`)

Copy A is linked to J and its Target job now matches tracked job K (status applied). K's card "Next step:
Prepare for the interview… — Open interview prep":

- empty editor → no dialog; the empty draft is aimed at K (`target=Platform Engineer@Initech`), interview
  prep opens on a resume with no content, A untouched (K unlinked). The tailored resume aimed at K is
  never mentioned.
- unrelated unsaved draft → no dialog; a new copy "Platform Engineer — Initech" is created from the
  draft ("Unsaved draft" content), linked to K (`qa-j2→NEW`, `forJob=qa-j2`), and interview prep opens.
  From then on `copyAimedFromOtherJob(K)` is silent (K has a copy), so A's aim at K disappears from every
  disclosure — a silent duplicate that hides the real copy.

R626 fixed Target my resume / Cover letter on K's card; interview prep is the remaining direct entry.
Also: the interview confirm dialog (shown only when a standalone draft is at risk) claimed "This opens the
resume copy you already targeted at this job" even when no such copy exists.

## Fix (Jobs.tsx)

- `aimedCopyFor` covers `interview`; the next-step interview action opens the confirm dialog when
  `draftAtRisk(job) || aimedCopyFor(job, 'interview')`.
- Dialog prefix for interview: *""A" is aimed at this job but is linked to "J" at Globex — "Open that
  copy" opens it and runs interview prep for this job from that copy[, saving your draft as a copy
  first]. Otherwise: …*; **Open that copy** → `openAimedCopy(job, A, 'interview')` →
  `/builder?doc=interview&job=K` (R624 resolves the brief to K because A targets K; J keeps A).
- Interview description now tells the truth for the no-copy cases: empty draft → "aims your draft at
  this posting … the brief has no resume to draw on until you write one"; contentful draft → "saves a
  copy … links this job to it and opens interview prep".
- Primary "Open interview prep" behaviour unchanged.

## Acceptance

1280 + 375: K's interview action opens the dialog with the disclosure and **Open that copy**; clicking
it → active = A, `qa-j1→A` intact, K unlinked, interview tool open with no retarget notice; draft variant
saves the draft as a copy first. "Open interview prep" keeps the previous behaviour. Control (A targets
J): no dialog, straight to the tool as before. No overflow, 0 console errors, no AI calls, storage
restored.
