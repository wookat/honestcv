# R602 — Career documents remember the job they were written for

Date: 2026-09-06 · Scope: `src/lib/documents.ts`, `src/pages/Builder.tsx`, `src/pages/Dashboard.tsx`

## Evidence (production index-DJjbFGDT.js, `qa/r602-evidence.cjs`)

Seed two cover letters for the same tracked job, pipeline linked to the newer one (the R601
newest-wins outcome), plus one general letter:

| row on `/documents`                | meta shown                                                   |
| ---------------------------------- | ------------------------------------------------------------ |
| Globex — Cover letter (superseded) | `Cover letter · Edited today`                                |
| Globex — Cover letter (2) (linked) | `Cover letter · Edited today · for Site Reliability Engineer at Globex` |
| General cover letter               | `Cover letter · Edited today`                                |

- The superseded letter is indistinguishable from a general letter; its viewer has no "Written for"
  line and no link back to the job. Only the title hints at the company.
- After the job is untracked, *both* Globex letters collapse to `Cover letter · Edited today`.

Root cause: `CareerDoc` has no job field — the only job↔document relation is the pipeline's
`coverDocId` / `interviewDocId` / `resignationDocId`, so the moment a link moves (R601) or the job is
untracked (R587 discloses it, but the doc keeps no trace) the document's origin is gone. Resume copies
already carry `targetRole` / `targetCompany` / `jobDescription` in their data, which is what lets the
dashboard show the R593/R594 notes ("job no longer tracked", "tracked job uses another copy") for
copies; documents have no equivalent.

## Fix

- `documents.ts`: `CareerDoc.forJob?: { id: string; title: string; company: string }`. `saveCareerDoc`
  takes an optional `forJob`; `sanitizeCareerDoc` keeps a well-formed one and drops anything else.
  `duplicateCareerDoc` keeps it via the spread (a duplicate of a letter written for a job is still a
  letter written for that job — same stance as R594).
- `Builder.tsx` `BundleToolDialog`: the first Save passes `forJob` from the pipeline entry of
  `jobId` (`{ id, title, company }`). Nothing else about saving changes.
- `Dashboard.tsx` document rows and the viewer header use one `docTargetNote(d)`:
  - pipeline links the doc → unchanged `for <Title at Company>` → `/jobs?job=<id>`;
  - not linked, `forJob` set, job still tracked → `written for <Title at Company> · job uses another
    <cover letter | interview brief | resignation letter>` → `/jobs?job=<id>`;
  - not linked, `forJob` set, job not tracked → `written for <Title at Company> · job no longer
    tracked — find it again` → `/jobs?q=<title>` (same route the R593 copy note uses);
  - no `forJob` → nothing (general document, unchanged).
- Documents saved before R602 have no `forJob` and keep today's behaviour; no migration.

## Acceptance (production, 1280 + 375)

- Seeded superseded letter row and viewer show `written for Site Reliability Engineer at Globex · job
  uses another cover letter` linking to `/jobs?job=qa-j1`; linked letter row unchanged; general
  letter unchanged.
- Job untracked → both letters show `written for … · job no longer tracked — find it again` →
  `/jobs?q=Site+Reliability+Engineer`.
- End-to-end on production: `/jobs` → Cover letter → Start from a template → Save stores
  `forJob: { id, title, company }` on the new document (storage read).
- 375: row meta wraps, no page overflow; storage restored; 0 console errors; 0 AI calls.
