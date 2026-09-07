# R584 — Document delete dialog discloses the tracked-job link

## Evidence (production CDP, cv.zalize.com)
- Seeded a tracked `applied` job (Globex) with `coverDocId` → its linked cover letter and opened /documents → Delete. The confirm dialog reads only: "This removes the document from this browser permanently." — zero mention that this is the cover letter of a tracked application, whose /jobs "Cover letter: … · Open" row (R384) disappears on confirm.
- Root cause: the `confirmDeleteDoc` DialogDescription is static copy predating the job↔document links (R563–R567); the untrack paths got honest disclosure in R582/R583 but the delete-document side did not.

## Comparison
Rezi-class products disclose what an irreversible delete affects; our own untrack dialogs (R582/R583) already name the linked-document loss — the reverse direction (deleting the document out from under the tracked job) is the last silent destroyer of a job↔document link.

## Minimal fix
`src/pages/Dashboard.tsx` only:
- In the `confirmDeleteDoc` DialogDescription, when `jobByDoc.has(confirmDeleteDoc.id)`, append: "It's linked to your tracked <title> application at <company>; that application loses this document." Unlinked docs keep the original copy. No storage or flow changes; undo bar still restores the doc (and the still-stored doc id relinks).

## Validation
- `npx tsc -b`, `npx eslint src/pages/Dashboard.tsx`, `npm run build`, `npm run verify-dist`.
- Deploy attempt (`npx wrangler deploy`); Workers Routes auth code 10000 expected — report honestly.
- Production QA at 1280/375: linked doc shows the disclosure with job title/company; unlinked doc keeps original copy; Undo restores the doc and the /jobs row returns; zero overflow; storage restored to the six-key baseline; zero AI quota.
