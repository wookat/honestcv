# R635 — An earlier document written for the job can be made the linked one again ("Use this one instead"), without deleting the current one

Date: 2026-09-06 · Production before: `index-Cq_vOAZH.js` (R634) · Evidence: `qa/r635-evidence.cjs`

## 1. Evidence (production, real posting 2091088, Applied, two cover letters written for it, the newer one linked)

Job card tracked box:

```
Cover letter: | Creative Force — Cover letter (2) | Open
Earlier cover letter: | Creative Force — Cover letter | Open
```

`row 1 buttons: ["Open"]` — no action. `/documents?doc=qa-cover1`:

```
written for Sales Jedi at Creative Force · job uses another cover letter
use buttons: 0
```

So once a second letter replaced the link (R601 discloses that this happens), the only way back to the first letter is to **delete** the second one (then R603's "Use for this job" appears). A reversible relationship change has no reversible UI; the user is pushed to destroy a document to undo a link.

Contrast: the copy side already has a non-destructive swap (R603 "Use for this job" when the link is gone, R620/R621 "Link this copy to it").

## 2. Design (`Jobs.tsx`, `earlierDocRows`)

```diff
-        {!hasLinked && (
-          <button onClick={() => applyPipeline(relink(entry.job.id, doc.id))}>Use for this job</button>
-        )}
+        <button onClick={() => applyPipeline(relink(entry.job.id, doc.id))}>
+          {hasLinked ? 'Use this one instead' : 'Use for this job'}
+        </button>
```

- Same `setPipeline{Cover,Interview,Resignation}Doc` relink as the no-link case; nothing is deleted. The previously linked document keeps its `forJob` (the Jobs page stamps linked documents on load — R610), so it immediately appears as an *Earlier …* row with its own *Use this one instead* — the swap is symmetric and reversible.
- `/documents` keeps its "job uses another cover letter" link to the job card (R607 pattern: the card is where links change).

## 3. Acceptance (production, 1280 + 375)

- Earlier row shows *Open · Use this one instead*; clicking it → `coverDocId` = earlier doc, both documents still present, rows swap (`Cover letter: doc1`, `Earlier cover letter: doc2 · Use this one instead`).
- Interview / resignation rows behave the same (shared helper). No overflow, zero console errors, zero AI calls, storage restored.

## 4. Result

Deployed `index-CSKiwVKd.js` (Worker upload OK; Routes API code 10000 unchanged). Production QA (`qa/r635-evidence.cjs swap`, real posting 2091088, 1280 + 375):

- Earlier row: `Open · Use this one instead`. Click → `2091088:applied→cover=qa-cover1`; both documents still present with `forJob=2091088`.
- Rows swap in place: `Cover letter: Creative Force — Cover letter · 1 to fill · Open` / `Earlier cover letter: Creative Force — Cover letter (2) · Open · Use this one instead`.
- No overflow (375: 360/375), zero console errors, zero `/api/` calls beyond the job search, storage restored.
