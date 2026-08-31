# R138 — "Date created" sort for saved copies on the dashboard

## Audit evidence (Rezi, live DOM, 2026-08-31)

Rezi's resume dashboard (`/dashboard/resumes`) has a sort control whose
*default* is **Created**, alongside Name and Edited. RezUp's dashboard only
offers "Last edited" and "Name A–Z" — once a user renames, refolders or
autosaves into a copy, its `updatedAt` moves and the original creation
order is unrecoverable, so "which resume did I make first for this search"
can't be answered.

## Change (zero Resume-schema, zero deps)

- `ResumeVersion` gains optional `createdAt?: number` (versions metadata in
  `honestcv.resumeVersions`, not the Resume document schema).
- `saveResumeVersion` and `duplicateResumeVersion` stamp `createdAt: Date.now()`.
- `listResumeVersions` sanitises: keep finite positive numbers, else drop.
- Rename/update/autosave (`renameResumeVersion` / `updateResumeVersion` /
  `syncActiveVersion`) spread the existing record, so `createdAt` survives.
- Dashboard: `sortBy` adds `'created'` with a "Date created" option;
  sort key is `createdAt ?? updatedAt` (pre-R138 copies fall back to their
  last-edited time), newest first, matching the existing "Last edited"
  direction.

## Out of scope

- No persistence of the chosen sort (matches current behaviour of the control).
- No Resume schema change, no new localStorage keys, no dependencies.
- Share page and Builder untouched.
