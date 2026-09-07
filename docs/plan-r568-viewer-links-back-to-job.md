# R568 — document viewer links back to the tracked job

## Evidence (production CDP, 2026-08-31)

- Seed: careerDocs `[{id:'d1',kind:'cover',title:'Globex — Cover letter',…}]`,
  jobPipeline entry `j1` (Senior Engineer at Globex, `coverDocId:'d1'`).
- `/documents` card meta (R567): `Cover letter · Edited today · for Senior Engineer at Globex` — link present.
- `/documents?doc=d1` viewer dialog description: `Cover letter — edits are saved to this browser.` — **no job link anywhere in the dialog**.
- The viewer is exactly where `/jobs` detail-pane `Open` (R384/R564/R565) lands the user, so the association is invisible at the moment it matters most; the user must close the dialog and find the card to get back to the job.
- Also probed: deleting a linked document leaves a dangling `coverDocId` in the pipeline, but `/jobs` already hides the row when the doc is missing — no user-visible symptom, not a gap.

## Rezi comparison

Rezi's August "Improved Application Tracking" direction keeps application artifacts
navigable in both directions. R567 closed cards → job; the viewer is the remaining
document surface without the back-link.

## Fix (smallest)

`src/pages/Dashboard.tsx` only — viewer `DialogDescription`: when
`openDoc && jobByDoc.has(openDoc.id)`, append
`· for <Link to={/jobs?job=<encoded id>}>Title at Company</Link>`
(same SPA Link + underline styling as the R567 card meta; zero render when
unassociated). `useHistoryGuard`'s link interception already protects unsaved
viewer edits from the new link.

## Non-goals

- No changes to jobs.ts, documents.ts, save-time association, or delete semantics.
- No dangling-id cleanup (no visible symptom).

## Validation

`npx tsc -b`, `npx eslint src/pages/Dashboard.tsx`, `npm run build`,
`npm run verify-dist`; `npx wrangler deploy` (Workers Routes code 10000 expected);
production QA at 1280/375: link in viewer for associated doc, click lands
`/jobs?job=j1` detail pane, unassociated doc shows no link, dirty-edit link guard
still confirms, zero overflow, restore six-key storage baseline, zero AI quota.
