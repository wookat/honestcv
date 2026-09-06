# R585 — Resume-copy delete dialog discloses the tracked-job link

## Evidence (production CDP, cv.zalize.com)
- Seeded a tracked `applied` job (SRE at Globex) with `resumeVersionId` → its targeted copy on /dashboard shows the "for SRE at Globex" backlink (R570), but clicking Delete pops only: "This removes the copy from this browser permanently." — zero mention that this is the application's targeted resume; confirming silently strips the application of its resume, match% and tailoring report basis.
- Root cause: the `confirmDelete` DialogDescription only special-cases share links (R367); the job link (R183/R570) was never disclosed. R584 fixed the same gap for documents; targeted copies are the remaining linked artifact with a silent delete.

## Minimal fix
`src/pages/Dashboard.tsx` only: in the `confirmDelete` DialogDescription, when `jobByVersion.has(confirmDelete.id)`, append "It's the targeted resume for your tracked <title> application at <company>; that application loses this resume." before the existing share-link sentence. Unlinked copies unchanged; delete/undo/storage flow zero changes.

## Validation
- `npx tsc -b`, `npx eslint src/pages/Dashboard.tsx`, `npm run build`, `npm run verify-dist`.
- Deploy attempt; Workers Routes auth code 10000 expected — report honestly.
- Production QA 1280/375: linked copy shows disclosure; unlinked copy keeps original copy; share-link sentence still appends; zero overflow; six-key baseline restored; zero AI quota.
