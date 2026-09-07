# R583 — Bulk untrack dialog discloses linked-document loss

## Evidence (production CDP, cv.zalize.com)
- Seeded two tracked jobs, one with a linked cover letter (`coverDocId`). Selected both via bulk mode → "Untrack 2" → dialog reads only "…deletes their application timelines and notes. Targeted resume copies stay on your dashboard." — zero mention of the linked document, which loses its job association on confirm (the exact loss R582 made honest on the single-row path).
- Root cause: the `confirmBulkUntrack` DialogDescription is static copy; it predates the R563–R567 job↔document links and the R582 disclosure.

## Comparison
Rezi-class trackers disclose what an irreversible bulk delete discards; our own single-row dialog (R582) already names the linked-document loss — the bulk path contradicts it.

## Minimal fix
`src/pages/Jobs.tsx` only:
- Compute the total `linkedDocCount` across the entries in `visibleBulkIds`.
- When >0, the bulk dialog description appends the R582 sentence pattern: "…and their links to N saved documents. Targeted resume copies and saved documents stay, but documents lose their link to these jobs."
- When 0, copy unchanged. No storage or flow changes; bulk untrack still always confirms.

## Validation
- `npx tsc -b`, `npx eslint src/pages/Jobs.tsx`, `npm run build`, `npm run verify-dist`.
- Deploy attempt (`npx wrangler deploy`); Workers Routes auth code 10000 expected — report honestly.
- Production QA at 1280/375: mixed selection shows the linked-doc sentence with the right count; doc-free selection keeps the original copy; confirm still removes entries and documents survive on /documents; zero overflow; storage restored to the six-key baseline; zero AI quota.
