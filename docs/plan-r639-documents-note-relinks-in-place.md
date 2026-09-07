# R639 — /documents note "use this one" relinks the document in place instead of only navigating

Date: 2026-09-06 · Production before: `index-DR9zDq6k.js` (R638)

## 1. Evidence (`qa/r639-evidence.cjs`, production)

Tracked job J (applied, no `coverDocId`), cover letter D with `forJob = J`:

```
doc1 row: … written for Site Reliability Engineer at Globex · job has no cover letter linked — use this one
doc1 controls: ["job has no cover letter linked — use this one"]      ← one <Link>
after click url: /jobs?job=qa-j1
stored: ["qa-j1→cover=-"]                                              ← nothing relinked
```

J linking another letter D2: `… · job uses another cover letter` — a link to the jobs board, no action at all.

So the wording promises an action ("use this one") but the click only navigates; the user must then find *Earlier cover letter · Use for this job* on the card (R603). "Uses another" had no path from here at all, although the card offers *Use this one instead* since R635. Documents were the last relationship surface without an in-place setter.

## 2. Design (`Dashboard.tsx` `docTargetNote`, shared by /documents rows and the open-document dialog)

```tsx
const linkDocToJob = (d: CareerDoc, jobId: string) => {
  const relink = d.kind === 'cover' ? setPipelineCoverDoc
    : d.kind === 'resignation' ? setPipelineResignationDoc : setPipelineInterviewDoc
  if (relink(jobId, d.id) === null) { setStorageError(true); return }
  setDocs(listCareerDocs())   // jobByDoc / trackedEntries re-read the pipeline from docs
}
…
<Link to={`/jobs?job=${id}`}>{live ? `job uses another ${noun}` : `job has no ${noun} linked`}</Link>
{' — '}
<button onClick={() => linkDocToJob(d, tracked.job.id)}>{live ? 'use this one instead' : 'use this one'}</button>
```

Same setters as the job card (R603/R635); the previously linked document is not deleted — it keeps `forJob` and its row flips to *job uses another … — use this one instead*, so the swap is reversible from either row. The link to the job stays on the status phrase.

## 3. Acceptance (production, 1280 + 375)

- unset: click → `qa-j1→cover=qa-doc1`, row reads `for Site Reliability Engineer at Globex`, URL stays `/documents`.
- other: D1 row shows *use this one instead*; click → link moves to D1, D2 row now shows the reversed note; both docs stored.
- No overflow, zero console errors, zero AI calls, storage restored.

## 4. Result

Deployed `index-Bn3Gx10U.js` (Worker upload OK; Routes API code 10000 unchanged). All four runs (2 modes × 2 widths) matched §3 exactly.
