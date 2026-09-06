# R570 — /dashboard resume-copy cards link back to the tracked job

## Evidence (production CDP, 2026-08-31)

- Seed: version `v1` ("Globex — Senior Engineer"), pipeline `j1` (applied, `resumeVersionId:'v1'`).
- /documents document cards (R567) already show `· for Senior Engineer at Globex` linking to `/jobs?job=<id>`.
- /dashboard copy card for the same targeted copy shows only `Edited today · ATS 11/100` —
  no signal that this copy belongs to a tracked application, no path back to the job whose
  match%/tailoring report lives on /jobs.

## Rezi comparison

Rezi's August "Improved Application Tracking" keeps application artifacts and their tracker
context linked in both directions. Our tracker→copy direction exists ("Open targeted copy");
the copy→tracker direction is missing on the primary resumes surface.

## Fix (smallest)

`src/pages/Dashboard.tsx` only — add a `jobByVersion` memo (scan `listPipeline()` for
`resumeVersionId`), and in both `versionCard` and `versionRow` meta lines append
`· for <Link to="/jobs?job=<id>">{title} at {company}</Link>` (same pattern/styling as the
R567 document-card link). No storage, scoring, or navigation changes.

## Validation

`npx tsc -b`, `npx eslint src/pages/Dashboard.tsx`, `npm run build`, `npm run verify-dist`;
`npx wrangler deploy` (Workers Routes code 10000 expected); production QA 1280/375:
linked copy shows the job link in card and row layouts, click lands on /jobs?job=<id>
detail pane, unlinked copies render nothing, zero overflow, restore six-key storage
baseline, zero AI quota.
