# R628 — SOP-10 audit node + "Target my resume / Cover letter" say (and let you choose) which resume the new copy is derived from

Date: 2026-09-06 · Production before: `index-BD4BDcUA.js` · Evidence script: `qa/r628-evidence.cjs`, `qa/r588-sweep.cjs`

## 1. Audit (SOP-10, ten rounds after R618)

### 1.1 Seven routes × 1280 / 375 (production, CDP)

| Route | 1280 (`scrollWidth`/`clientWidth`) | 375 | Inner overflow |
|---|---|---|---|
| `/` | 1265 / 1265 | 360 / 360 | `table.min-w-[560px]` comparison table — intentional horizontal scroll container (unchanged since R588) |
| `/builder` | 1280 / 1280 | 375 / 375 | `div.w-max` section tab strip — intentional horizontal scroll container (unchanged) |
| `/dashboard` `/jobs` `/documents` `/ats-checker` `/pricing` | 1265 / 1265 | 360 / 360 | none |

Zero page-level overflow at either viewport, zero console errors, localStorage keys restored to baseline (visiting `/builder` writes `honestcv.resumeHistory`, as in every prior audit). No new P0–P2 visual/responsive gap.

### 1.2 Rezi public pages (fetched, not inferred)

`https://www.rezi.ai/rezi-docs/job-search` (public guide), `https://www.rezi.ai/features`, `https://www.rezi.ai/tools/job-search`:

- "When you select **Target Resume**, Rezi lets you **choose a resume from your dashboard** and customize it for that specific role. From there, it opens your resume inside the AI Resume Builder."
- Statuses: Saved / Applied / Interviewing / Rejected; jobs sourced from company career pages; Apply Now leaves to the company site (Rezi does not submit applications).

These are competitor marketing/documentation claims; nothing about their implementation is assumed.

### 1.3 Gap chosen

RezUp's "Target my resume" / "Cover letter" mint the new targeted copy from **whatever is open in the editor**, without saying which resume that is and without a way to pick another one. Rezi's public guide explicitly lets the user choose the source resume. After R623–R627 the editor is very often holding *another job's* copy (the user just opened A for J, then browses to K), so the silent default is exactly the wrong source.

## 2. Evidence (production `index-BD4BDcUA.js`, `node qa/r628-evidence.cjs 1280 target proceed`)

Seed: `Master resume` (general summary) + copy A `SRE — Globex` (summary "SRE-tailored summary for Globex", linked to J, `forJob=J`) — A is the active copy in the editor; K tracked, no copy.

K's **Target my resume** dialog:

> This saves a copy of **your resume** targeted at this posting (filed under "Job applications" on your dashboard) and opens it in the editor. Your current draft keeps its own target job.

No mention that "your resume" is A, no selector. After **Create copy and open editor**:

```
versions: NEW:Platform Engineer — Initech:target=Platform Engineer@Initech:forJob=qa-j2:summary=SRE-tailored summary for Globex
links:    qa-j1→copy=A, qa-j2→copy=NEW
```

K's copy is A's Globex-tailored content relabelled for Initech; the general `Master resume` was never offered. The **Cover letter** dialog has the same wording and behaviour.

## 3. Design

Scope: the `confirmTarget` dialog on `/jobs`, only when its primary action will mint a new copy (`newCopyPending`: intent `target`/`cover`, no `targetedCopyOf(job)`, editor has content). Interview prep, orphan reconnection, linked-copy opening and all R623–R627 disclosures are untouched.

- `copySourceText()` — the description names the source instead of "your resume":
  - active copy: `"SRE — Globex" (the copy open in the editor, your copy for "Site Reliability Engineer" at Globex)` (the tracked-job clause only when a pipeline entry links that copy);
  - standalone draft: `your current draft`;
  - picked copy: `"Master resume"`.
- **Copy from** native `<select>` (same styling as the board filters) between header and footer: first option = what is open in the editor, then every other saved copy with content (`copySourceOptions()`). State `copySourceId` is reset whenever `setConfirmTarget` runs (wrapper around the state setter), so a re-opened dialog always starts from the editor.
- `prepareTargetedCopy(job, source?)` takes the picked `Resume`; `targetResume` passes `pickedSource()` on both the target and the cover path. The new copy still gets K's title/company/description and `forJob=K` via `createResumeVersion`, and is linked with `setPipelineVersion(K, new)` exactly as before. Nothing about the editor draft, A, or J→A changes.
- Not done (deliberately): letting the picker replace an existing linked/orphan copy (that would be a relationship move — the dialogs already disclose and route those cases); a source picker in Builder's own Target job section (its "Save as new copy for it" copies the copy being edited, which is the point).

## 4. Acceptance (production, 1280 + 375, `qa/r628-evidence.cjs`)

- `target pick` / `cover pick`: dialog names A as source with its tracked job; select lists `SRE — Globex (open in the editor)` + `Master resume`; after picking Master the description reads `a copy of "Master resume"`; proceeding creates `Platform Engineer — Initech` with `summary=General summary`, `forJob=qa-j2`, `qa-j2→NEW`, `qa-j1→A` unchanged, A's content unchanged, active = NEW, cover path lands on `/builder` with the cover tool.
- `target proceed` without picking: identical to pre-R628 behaviour (copy derived from A) but the dialog now says so.
- No overflow (1280: 1265/1280; 375: 375/375 with the dialog open), zero console errors, no AI calls (`/api/ai/quota`, `/api/jobs/search`, `/api/billing/status` only), localStorage restored to baseline.

## 5. Result

Deployed `index-D7ibJk8A.js` (Wrangler Routes API code 10000 as always — token lacks Routes permission; asset upload succeeded). All acceptance checks above passed at 1280 and 375. PR chain: R627 (#848) → R628.
