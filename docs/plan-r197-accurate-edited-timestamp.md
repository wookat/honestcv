# R197 — Organizational actions no longer pollute the "Edited" timestamp

## First-party evidence

Rezi public changelog, August 12, 2026 (Rezi Web App):

> "Improved Resume Unlocking — When you unlock a resume, the system now correctly
> maintains the 'updated at' timestamp, ensuring your document history remains
> accurate and organized."

Rezi treats `updatedAt` as *content* history: non-edit actions must not touch it.

## Current gap

`updateResumeVersion(id, patch)` bumps `updatedAt: Date.now()` for **every** patch.
Purely organizational actions therefore rewrite edit history:

- Moving a copy to a folder (R171 "Move to folder")
- Renaming a folder (rewrites `folder` on every member copy)
- Deleting a folder (clears `folder` on members)
- Renaming a copy / saving the edit dialog with nothing actually changed

Each of these makes the dashboard show "Edited today" on documents whose content
did not change, and reshuffles the "Recently edited" sort.

## Design (zero schema, zero UI change)

In `src/lib/resume.ts`:

```ts
// updateResumeVersion: bump updatedAt only when the patch carries real content change
const contentChanged =
  patch.data !== undefined && JSON.stringify(patch.data) !== JSON.stringify(v.data)
return { ...v, ...patch, ...(contentChanged ? { updatedAt: Date.now() } : {}) }
```

`renameResumeVersion` (metadata-only) no longer bumps. Real content saves —
`syncActiveVersion`, the edit dialog when target fields actually change, Builder
autosave — still bump exactly as before. `createdAt` semantics untouched.

## Acceptance

- Move to folder / folder rename / folder delete / copy rename leave "Edited N
  days ago" and the Recently-edited order unchanged.
- Edit dialog: saving with no changes leaves the timestamp; changing target
  role/JD bumps it.
- Builder editing a copy still bumps (autosave path).
- R171 folder features, R138 sorts, R183 targeted copies regress green.
