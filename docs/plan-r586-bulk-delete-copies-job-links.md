# R586 — Bulk copy-delete dialog discloses tracked-job links

## Evidence (production CDP, cv.zalize.com)
- Seeded two saved copies, one referenced by a tracked `applied` job (SRE at Globex) via `resumeVersionId`; /dashboard → Select… → Select all → "Delete 2…". On the R585 code the dialog reads only "This removes the selected copies from this browser permanently." (share-link count is the only special case) — zero mention that one of them is an application's targeted resume; confirming leaves the pipeline entry pointing at a deleted copy (`resumeVersionId: 'qa-v1'`, 0 copies left).
- Root cause: R585 fixed the single-copy `confirmDelete` dialog; the `confirmBulkDelete` description is the last copy-deletion path that never consulted `jobByVersion`. R583 closed the same single→bulk gap for untracking.
- Session note: the prior session (crashed, "Cannot resume") had already deployed this fix to production (bundle index-DMbVIuI_.js / Dashboard-cAN39G-7.js) but never pushed a branch or PR; this round lands the same change in the repo so main matches production. Verified by building this branch and diffing the Dashboard chunk against the production chunk.

## Minimal fix
`src/pages/Dashboard.tsx` only: in the `confirmBulkDelete` DialogDescription, count `bulkSelected` ids present in `jobByVersion` and, when >0, append before the share-link sentence:
- 1 → " One of them is the targeted resume for a tracked application, which loses this resume."
- n → " n of them are targeted resumes for tracked applications, which lose these resumes."
Zero-linked selections keep the original text; delete/undo/storage flow zero changes.

## Validation
- `npx tsc -b`, `npx eslint src/pages/Dashboard.tsx`, `npm run build`, `npm run verify-dist`.
- Built Dashboard chunk vs production chunk: identical modulo asset hashes.
- Deploy (`wrangler deploy` with CLOUDFLARE_WORKERS_API_TOKEN); Workers Routes auth code 10000 expected — report honestly.
- Production QA 1280/375: linked selection shows the singular disclosure, two linked copies show the plural, unlinked selection keeps original copy; zero overflow; storage restored to baseline; zero AI quota.
