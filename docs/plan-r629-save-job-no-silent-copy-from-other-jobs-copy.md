# R629 — "Save" on a job no longer silently mints its targeted copy from another job's copy that happens to be open in the editor

Date: 2026-09-06 · Production before: `index-D7ibJk8A.js` · Evidence script: `qa/r629-evidence.cjs`

## 1. Background

R183 (Rezi changelog parity, "when you save a job the system automatically prepares a targeted version of your resume") made `setStatus(job, 'saved')` auto-prepare a copy: base = the current editor content, target fields = the job's. In R183 the editor held *the* resume. Since then the editor is usually holding one of many copies (R589–R628 gave every path a way to open a job's copy), so "the current editor content" is often **another job's tailored copy**.

## 2. Evidence (production `index-D7ibJk8A.js`, `node qa/r629-evidence.cjs 1280 save`)

Seed: `Master resume` (general) + copy A `SRE — Globex` (summary "SRE-tailored summary for Globex", linked to J, `forJob=J`) open in the editor. Click **Save** on the list card of a real posting (2091101 "Senior React Full-stack Developer" at Lemon.io):

- no dialog, no toast, nothing said;
- storage afterwards:
  ```
  NEW:Senior React Full-stack Developer — Lemon.io:target=…@Lemon.io:forJob=2091101:summary=SRE-tailored summary for Globex
  links: 2091101:saved→copy=NEW, qa-j1:saved→copy=A
  ```
- Next step then reads *"Your targeted copy doesn't use any of this job's keywords yet — open it and add a few."* — about a copy the user never chose, whose content is J's tailoring wearing Lemon.io's label.

Control (`1280 control`): a standalone draft in the editor → Save mints the copy from the draft (R183 behaviour, kept).

The R628 picker only helps on the explicit "Target my resume / Cover letter" path; Save bypasses it.

## 3. Design

Smallest fix, no relationship moved, R183 kept for the base-resume case:

```ts
editorCopyAimedElsewhere(job): ResumeVersion | undefined
  // active saved copy with a non-empty targetRole that does not copyTargetsJob(job)

setStatus(job, 'saved'):
  mint automatic copy only if !editorCopyAimedElsewhere(job)   // orphan reconnection unchanged
```

- The job is still saved; it simply has no copy yet. Its Next step card says why and points to the explicit path: *"Create a resume targeted at this job — the editor holds "SRE — Globex", your copy for Site Reliability Engineer at Globex, so choose what to copy from."* (or *"aimed at …"* when that copy is not linked to a tracked job). "Target my resume" then opens the R628 dialog, which names the source and offers the **Copy from** picker.
- Automatic copy still happens when the editor holds a standalone draft or a copy with no target (e.g. a master resume), and orphan copies targeting the job are still reconnected on any status.
- Not done: asking on Save (a dialog on every Save would undo R183's one-click save); auto-picking a "master" (there is no such notion in the data — guessing would be exactly the silent wrong choice this round removes).

## 4. Acceptance (production, 1280 + 375, `qa/r629-evidence.cjs`)

- `save`: after Save the job is `saved→copy=-`, versions unchanged (Master + A), A still J's copy, editor untouched; Next step text as above; "Target my resume" dialog (1280) names A as source and lists Master in **Copy from**.
- `control`: standalone draft → copy minted from the draft and linked, as before.
- No overflow (1280: 1280/1280 with dialog, 375: 360/375), zero console errors, no AI calls, localStorage restored to baseline.

## 5. Result

Deployed `index-Bw8A5wnj.js` (Wrangler Routes API code 10000 — token lacks Routes permission; upload succeeded). All checks above passed. PR chain: R628 (#849) → R629.
