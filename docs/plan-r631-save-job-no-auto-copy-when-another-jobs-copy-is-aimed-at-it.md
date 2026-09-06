# R631 — "Save" on a job that another tracked job's copy is already aimed at no longer auto-mints a duplicate; Next step shows the R623 disclosure instead

Date: 2026-09-06 · Production before: `index-Cb1orKyu.js` (R630) · Evidence script: `qa/r629-evidence.cjs 1280 aimed`

## 1. Evidence (production)

Seed: copy A `SRE — Globex` linked to J, but its target fields re-aimed at the first real search result (2091088 "Sales Jedi" at Creative Force) — the R616/R622/R623 mismatch case. A is open in the editor. Click **Save** on 2091088:

```
NEW:Sales Jedi — Creative Force:target=Sales Jedi@Creative Force:forJob=2091088:summary=SRE-tailored summary for Globex
A:SRE — Globex:target=Sales Jedi@Creative Force:forJob=qa-j1
links: 2091088:saved→copy=NEW, qa-j1:saved→copy=A
next step: "Your targeted copy doesn't use any of this job's keywords yet — open it and add a few."
```

- No dialog. A second copy aimed at the same posting now exists (NEW is a byte-copy of A with the same target), and J still holds A which is aimed at 2091088.
- The Next step card's existing R623 branch — *"“A” is aimed at this job but is linked to J. → Open it to save a copy for this job"* — and the R626 Target/Cover dialog disclosure never get a chance to appear: Save minted first, so 2091088 "has a copy" and every disclosure about A disappears.
- R629's guard did not fire because it only covers a copy aimed *elsewhere*; here the editor's copy is aimed *at this very job* (`copyTargetsJob` true), which is precisely the R626 case that should be surfaced, not duplicated.

## 2. Design

```ts
// setStatus(job, 'saved'): automatic copy only when there is nothing to disclose about the base
!editorCopyAimedElsewhere(job) && !copyAimedFromOtherJob(job)
```

- The job is saved, has no copy, and its Next step already reads (R623): *"“A” is aimed at this job but is linked to “J” at Globex. → Open it to save a copy for this job"*; the Target/Cover dialogs (R626) offer **Open that copy**. Nothing new to write.
- Orphan reconnection and the plain R183 case (standalone draft / untargeted copy in the editor, no other copy aimed at the job) are unchanged.

## 3. Acceptance (production, 1280 + 375)

- `aimed`: after Save → `2091088:saved→copy=-`, versions unchanged (Master + A), A still linked to J and aimed at 2091088; Next step text is the R623 disclosure with the "Open it to save a copy for this job" button.
- `save` (R629) and `control` (R183) unchanged.
- No overflow, zero console errors, no AI calls, storage restored.

## 4. Result

Deployed `index-BI4omvgf.js` (Wrangler Routes API code 10000 — token lacks Routes permission; upload succeeded). `1280 aimed` / `375 aimed`: `2091088:saved→copy=-`, versions unchanged, A still `qa-j1→A` and aimed at 2091088, Next step = *“SRE — Globex” is aimed at this job but is linked to “Site Reliability Engineer” at Globex. → Open it to save a copy for this job*; `1280 control`: copy still minted from the standalone draft. No overflow (375: 360/375), zero console errors, no AI calls, storage restored. PR chain: R630 (#851) → R631.
