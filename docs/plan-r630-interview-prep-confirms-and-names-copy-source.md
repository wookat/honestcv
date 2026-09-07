# R630 — "Open interview prep" on a job without a copy confirms, names the resume the new copy is derived from and offers the Copy-from picker

Date: 2026-09-06 · Production before: `index-Bw8A5wnj.js` (R629) · Evidence script: `qa/r630-evidence.cjs`

## 1. Evidence (production, `node qa/r630-evidence.cjs 1280 interview`)

Seed: `Master resume` (general) + copy A `SRE — Globex` (summary "SRE-tailored summary for Globex", linked to J, `forJob=J`) open in the editor; K `Platform Engineer — Initech` tracked as **applied**, no copy. Click K's Next step **Open interview prep**:

- `dialog shown: false` — straight to `/builder` with the Interview Prep tool open;
- storage afterwards:
  ```
  NEW:Platform Engineer — Initech:target=Platform Engineer@Initech:forJob=qa-j2:summary=SRE-tailored summary for Globex
  links: qa-j1:saved→copy=A, qa-j2:applied→copy=NEW   active=NEW
  ```

So the third minting path (after Target/Cover in R628 and Save in R629) still mints K's copy from J's tailoring, links it and runs interview prep against it, with no dialog, no source named and no choice. The confirm dialog exists for this intent but is only reached when a standalone draft is at risk (R595) or another job's copy is aimed at K (R627).

## 2. Design

Same rule as R628, applied to the interview intent:

```ts
newCopyPending(job, intent)   // 'interview' added to 'target' | 'cover'

nextStep(applied|interviewing).onClick:
  draftAtRisk || aimedCopyFor(job,'interview') || newCopyPending(job,'interview')
    ? setConfirmTarget({ job, intent: 'interview' })      // was: openInterviewPrep(job) directly
    : openInterviewPrep(job)

openInterviewPrep(job, source?)  → prepareTargetedCopy(job, source)
targetResume(job,'interview')    → openInterviewPrep(job, pickedSource())

dialog (interview, new copy): "This saves a copy of ${copySourceText()} targeted at this posting …"
                              + the existing Copy from <select> (rendered via newCopyPending)
```

- A job that already has a copy (linked or orphan) still opens interview prep with one click — nothing new is minted, nothing to disclose.
- Not done: refusing to mint from another job's copy (the user is explicitly asking for a brief now; naming the source and offering the alternatives is the honest, non-blocking answer, as R628 decided for Target/Cover).

## 3. Acceptance (production, 1280 + 375)

- `interview`: confirm dialog appears on /jobs; text names “SRE — Globex” (the copy open in the editor, your copy for J at Globex); **Copy from** lists `SRE — Globex (open in the editor)` + `Master resume`; confirming mints from A (unchanged R628 default) and links K.
- `pick`: choosing `Master resume` → new copy summary is "General summary", `forJob=qa-j2`, K linked to it, A untouched and still J's, editor switched to the new copy, `/builder` interview tool open.
- `control` (standalone draft, no copies competing beyond Master): dialog names "your current draft"; copy minted from the draft.
- No overflow, zero console errors, no AI calls (interview tool opened, nothing generated), storage restored.

## 4. Result

Deployed `index-Cb1orKyu.js` (Wrangler Routes API code 10000 — token lacks Routes permission; upload succeeded). All four runs passed (`1280 interview`, `1280 pick`, `375 pick`, `1280 control`): dialog shown on /jobs with the source named and **Copy from** listing the alternatives; `pick` mints `summary=General summary`, `forJob=qa-j2`, `qa-j2:applied→copy=NEW`, A untouched (`qa-j1→A`); no overflow (375: 375/375 with dialog), zero console errors, no AI calls, storage restored. PR chain: R629 (#850) → R630.
