# R102 — Move copies into folders from the builder

## First-hand evidence (Rezi, 2026-08, logged-in editor)

- `~/audit-r1/shots-r102/move.png|txt`: the resume switcher menu's **Move** opens a
  folder picker ("My Dashboard" tree) — the live resume can be filed into a
  dashboard folder without leaving the editor.
- `~/audit-r1/shots-r102/download.txt`: editor Download menu = PDF / DOCX / Save
  to Drive — we already exceed on formats (PDF/DOCX/TXT/MD); Drive is out of scope
  (no Google integration).
- `~/audit-r1/shots-r102/dashboard.txt`: dashboard "drop a resume here" import —
  already covered (R24 import tile has drag & drop).

## Gap

Since R61 copies have an optional `folder`, but it is only editable/visible in the
Dashboard card edit dialog. The builder Copies dialog — after R100/R101 the primary
copy-management surface — neither shows a copy's folder nor lets you set one.
Filing the copy you just saved means leaving the editor.

## Design

Builder.tsx only, reusing the R101 inline-edit row:

- Each row's metadata line shows the folder when set: `<date> · <folder> · ATS n/100`
  (same "· folder" affordance as the Dashboard card).
- The pencil edit mode gains a second input, **Folder**, under the name input,
  backed by a `<datalist>` of existing folder names (same pattern as Dashboard's
  edit dialog). Commit (Enter/blur outside both inputs/pencil re-click) calls the
  existing `updateResumeVersion(id, { name, folder })`; empty folder clears it
  (`undefined`), empty name keeps the old name (R101 rule).
- Escape still cancels via the DialogContent `onEscapeKeyDown` (R101 fix).

Non-goals: no folder tree/picker UI (folders are flat strings), no folder filter in
the builder dialog (Dashboard already filters), no schema/AI/scoring/storage-key
changes — `folder` is an existing optional field.

## Verification

- `npm run lint`, `npx tsc -b`, `npm run build` locally.
- Production QA: set a folder from the builder (row shows `· folder`, Dashboard
  filter picks it up, persists after F5), clear a folder, rename+folder in one
  edit, datalist suggests existing folders, linked-copy edit leaves
  `activeVersionId`/data untouched, Escape cancel keeps dialog open (R101
  regression), 375px layout, console clean, zero AI, byte-for-byte restore.
