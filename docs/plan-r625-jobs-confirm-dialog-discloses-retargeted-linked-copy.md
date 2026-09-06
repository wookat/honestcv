# R625 — /jobs confirm dialogs still call a retargeted linked copy "the resume copy targeted at this job"

## Evidence (production `index-B1vM4Z8p.js` / `index-Bf8ZlToz.js`, `qa/r624-evidence.cjs`)

Copy A is linked to tracked job J (SRE, Globex) but its Target job now matches tracked job K
(Platform Engineer, Initech). On J's card:

- **Cover letter** → dialog *"Write a cover letter for "Site Reliability Engineer"?" — "This opens the
  resume copy targeted at this job in the editor, then opens the cover letter tool pre-filled for this
  company."* Both clauses are false after R624: the copy is targeted at K, and the tool now prefills
  Initech and links the letter to K (disclosed only once the tool is open).
- **Open targeted resume** (main button) → *"This job already has a targeted copy of your resume — the
  editor opens that copy."* — same claim; the only path to a copy that actually targets J is to open A
  and re-aim it by hand.

R623 fixed the card's "Next step" line; the confirm dialogs (`confirmTarget`, intents `target` /
`cover` / `keywords`) still describe the stale link, and offer no way to get a copy for J.

## Fix (Jobs.tsx)

`retargetedLinkedCopy(job)` = linked copy whose `targetRole` is non-empty and
`!copyTargetsJob(copy.data, job)`; when set, the dialog:

- Description (all intents): *"The copy linked to this job, "A", now targets Platform Engineer at
  Initech — the editor opens that copy."* + for `cover`: *"The cover letter tool then writes for that
  job and links the letter to it, not to this one."*
- Primary button: **Open that copy** (cover: **Open cover letter tool** unchanged — the tool discloses).
- New outline button **New copy for this job from "A"** (intents `target` / `cover`):
  `createResumeVersion("J — Globex", { ...A.data, targetRole/targetCompany/jobDescription: J }, 'Job
  applications', forJob J)` → `setPipelineVersion(J, new)` → open it (cover: `/builder?doc=cover&…`).
  J's link moves from A to the new copy — that is the button's stated purpose; A keeps its content and,
  being aimed at K, shows on K's card as "Reconnect targeted copy" (R604). If the unsaved standalone
  draft is at risk it is saved as a copy first (`keepDraftAsCopy`, existing behaviour of "Save draft as
  copy, then open"), and the description says so.

Controls: linked copy still targets J, orphan copy, no copy — dialog texts and buttons unchanged.

## Acceptance

- 1280 + 375, J's card: Open targeted resume → dialog discloses A's new target, "New copy for this
  job from "A"" creates `J — Globex` (forJob J, target fields J), `qa-j1→<new>`, A unlinked, editor
  active = new copy; Cover letter → same disclosure + cover sentence; new-copy path lands on
  `/builder?doc=cover&company=Globex&job=qa-j1` with the tool linking to J and no retarget notice.
- Control (A targets J): dialog texts unchanged, no new-copy button.
- No overflow, 0 console errors, no AI calls, localStorage restored.
