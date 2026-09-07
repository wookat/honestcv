# R624 — Cover letter / interview prep opened for job J from a copy that now targets job K: content is K's, link is J's

## Evidence (production `index-B1vM4Z8p.js`, `qa/r624-evidence.cjs`)

Seed: copy A (`SRE — Globex`) is linked to tracked job J (Site Reliability Engineer, Globex) but its
Target job fields were edited to tracked job K (Platform Engineer, Initech, JD "Platform posting…").

From J's card → **Cover letter** → confirm "Open cover letter tool":

- Company field: `Globex` (from the `?company=` deep link — J's company).
- Template letter: *"I'm writing to apply for the **Platform Engineer** position at **Globex**"* — role from
  the copy (K), company from the card (J). The AI path uses the same inputs: `resume.jobDescription`
  (K's posting) + `company` (Globex).
- Save note: *"Saving links this cover letter to "Site Reliability Engineer" at Globex on your jobs board."*
- Stored after Save: `cover:Globex — Cover letter:forJob=qa-j1`, `qa-j1→cover=<id>`.

So the letter is written for K's posting, addressed to J's company, and filed as J's cover letter with
`forJob = J`. Every later label (dashboard "Written for SRE at Globex", J's card "Cover letter saved") is
false. Interview prep (reachable from "Open interview prep" once J is applied/interviewing) has the same
shape: brief generated from K's JD, linked to J.

Dashboard (R616/R620), builder Target job (R622) and the jobs board (R623) already disclose this
retargeted-copy state; the letter tools were the last surface still acting on the stale link.

## Fix (Builder.tsx)

Parent resolves the tool's jobs once, from the edited copy's live target fields:

```ts
const toolJobs = useMemo(() => {
  // openedFor: the job the tool was opened for (deep link `?job=` or the copy's linked job)
  // if the copy still targets it → { openedFor: null, linkJob: openedFor }   (unchanged behaviour)
  // else → { openedFor, linkJob: tracked job the copy's target now matches ?? null }
}, [toolOpen, toolJobId, linkedJob, targetRole, targetCompany, jobDescription])
```

- `jobId` passed to `BundleToolDialog` = `toolJobs.linkJob?.id` — a saved letter/brief is linked (and
  `forJob`-stamped) to the job its content is actually for, or to no job when that target isn't tracked.
  It is never linked to J while written for K.
- Cover-letter company field is prefilled from the copy's `targetCompany` when the deep-link company
  belongs to a job the copy no longer targets (no more "Platform Engineer position at Globex").
- New `openedFor` prop → disclosure under the dialog description, before any generation:
  *"This copy's Target job is Platform Engineer at Initech, not "Site Reliability Engineer" at Globex —
  the cover letter is written for that job and Save links it to "Platform Engineer" at Initech instead."*
  (or *"…and Save doesn't link it to a tracked job."* when K isn't tracked), with **Change the copy's
  target →** (`onJumpToTarget`, where R622 offers "Save as new copy for it").
- Existing notes keep working against the resolved `linkJob`: "This job already has "…" saved — Save
  makes this one the cover letter linked to the job" now refers to K's letter, not J's.

No pipeline link is moved; J keeps its copy link and any existing letter. Control (copy still targets
J): no disclosure, company = deep-link company, Save links to J — unchanged.

## Acceptance

- 1280 + 375: from J's card, cover tool shows the disclosure, company field `Initech`, template says
  "Platform Engineer position at Initech", Save stores `forJob=qa-j2` and `qa-j2→cover=<id>`, J has no
  cover link. Interview prep from J (status applied): disclosure shown, Save → `qa-j2→interview=<id>`.
- Control: no disclosure, `Globex`, Save → `forJob=qa-j1`, `qa-j1→cover=<id>`.
- No horizontal overflow, 0 console errors, no AI calls (template path), localStorage back to baseline.
