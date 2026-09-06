# R634 — Tracked job card names its linked resume copy (and says when the copy now targets another job) at every status, not only via the "saved" Next step

Date: 2026-09-06 · Production before: `index-Dr0tcODM.js` (R633) · Evidence: `qa/r634-evidence.cjs`

## 1. Evidence (production, real posting 2091088 "Sales Jedi" at Creative Force, status Applied, linked copy A)

Two fixtures, identical output:

| fixture | header | Next step | anything naming the copy |
|---|---|---|---|
| **mismatch** — A's Target fields changed to *Site Reliability Engineer at Globex* | `Targeted copy: 0% keyword match` | *Prepare for the interview … → Open interview prep* | none |
| **match** (control) — A targets this job | `Targeted copy: 0% keyword match` | same | none |

```
tracked box: Next step | … | Application timeline | Applied · Sep 6 | Draft follow-up email | … | Notes
```

The tracked box lists *Cover letter: … Open*, *Interview prep: … Open*, *Resignation letter: … Open* rows, but has **no row for the resume copy** the job is linked to. The only copy-related disclosure on the card — R623's *"Your targeted copy “A” now points at …"* — lives in `nextStep()`, whose `rejected` / `offer` / `applied` / `interviewing` branches return before the copy checks. So from the moment a job is marked Applied, its copy is anonymous and a retargeted copy is indistinguishable from a matching one (the header keyword match is computed against this job either way).

## 2. Design (`Jobs.tsx`, tracked box, first row)

```tsx
{(() => {
  const copy = linkedVersion(entry.job.id)
  if (!copy) return null
  const retargeted = retargetedLinkedCopy(entry.job)
  return (
    <p className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
      <span className="text-muted-foreground">Targeted resume:</span>
      <span className="font-medium">{copy.name}</span>
      {retargeted && <span className="text-amber-700 dark:text-amber-400">now targets {copyTargetText(retargeted)}</span>}
      <button onClick={() => setConfirmTarget({ job: entry.job, intent: 'target' })}>Open</button>
    </p>
  )
})()}
```

- Same row shape as the document rows; `Open` goes through the existing `confirmTarget` path (draft-at-risk guard, R625 "New copy for this job" when retargeted).
- No row when the job has no live linked copy — the main button already says *Target my resume* / *Reconnect targeted copy*.
- Uses the existing `retargetedLinkedCopy` / `copyTargetText` (same rule as R623: company + exact title or exact JD; a copy with an empty target role is not "retargeted").

## 3. Acceptance (production, 1280 + 375)

- Applied + mismatch: row *Targeted resume: “Sales Jedi — Creative Force” · now targets Site Reliability Engineer at Globex · Open*.
- Applied + match: row *Targeted resume: “Sales Jedi — Creative Force” · Open*, no amber note.
- No linked copy: no row. No overflow, zero console errors, zero AI calls, storage restored.

## 4. Result

Deployed `index-Cq_vOAZH.js` (Worker upload OK; Routes API code 10000 unchanged). Production QA (`qa/r634-evidence.cjs`, real posting 2091088):

- 1280 Applied + mismatch: `Targeted resume: | Sales Jedi — Creative Force | now targets Site Reliability Engineer at Globex | Open`.
- 1280 Applied + match: `Targeted resume: | Sales Jedi — Creative Force | Open` (no amber note).
- 375 Offer + mismatch: same row, `scrollWidth 360 / innerWidth 375`.
- 375 Applied + orphan (link id points at a deleted copy): no row; main button is the existing *Target my resume / Reconnect* path.
- Every run: zero console errors, zero `/api/` calls beyond the job search, storage restored to baseline.
