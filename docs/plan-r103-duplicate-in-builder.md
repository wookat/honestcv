# R103 — Duplicate a copy from the builder Copies dialog

## First-hand evidence (2026-08, logged-in Rezi)
- `~/audit-r1/shots-r100/switcher-open.png` + this round's `~/audit-r1/shots-r103/dashboard.{png,txt}`:
  the Rezi editor's resume switcher menu offers **Duplicate** alongside
  Settings / History / Move / Download / Delete — you can fork the current
  resume without leaving the editor.
- R103 dashboard re-audit found no folder-management or other new gaps on the
  Rezi dashboard surface (single resume card, create/drop entry, AI Agent tile
  — all already covered or previously rejected).

## Gap
Our builder Copies dialog (the primary copy-management surface since
R100/R101/R102) offers Open / Rename+Folder / Delete per row — but not
**Duplicate**. Forking a copy requires a detour to the Dashboard card, exactly
the round-trip R101/R102 eliminated for rename/folder.

Secondary pre-existing defect found while reading the code:
`duplicateResumeVersion` (src/lib/resume.ts) builds the new record from
`{ id, name+" (copy)", updatedAt, data }` only — it silently **drops the
source's `folder`**, so duplicating a filed copy loses its folder on both
surfaces.

## Design
1. `duplicateResumeVersion`: spread the source record instead of enumerating
   fields, overriding `id`, `name`, `updatedAt` — folder (and any future
   optional metadata) is preserved. Same signature, same return.
2. Builder Copies dialog: add a ghost Copy-icon button (`aria-label=
   "Duplicate copy <name>"`, 40×40 mobile / 28×28 desktop, matching the R101
   pencil) before Open. `onClick={() => setVersions(duplicateResumeVersion(v.id))}`
   — no link change: the duplicate is NOT auto-opened (same semantics as the
   Dashboard button; the user stays on the copy they're editing).

## Non-goals
- Auto-opening the duplicate (Rezi's Duplicate navigates; our linked-copy
  model makes staying put safer and matches the existing Dashboard behavior).
- Settings/History parity items (already covered: R101 rename, R28 history).
- Any schema / storage-key / AI / scoring / hosted-persistence change.

## Verification
- Duplicate a non-linked copy: new row `"<name> (copy)"` at top, folder
  preserved, `data` deep-equal, source untouched, `activeVersionId` unchanged.
- Duplicate the linked (· editing) copy: link stays on the source.
- Dashboard shows the duplicate with the same folder; folder chips count it.
- Persistence across F5; 375px: button 40×40, no horizontal overflow.
- Console clean; zero AI calls; localStorage restored byte-for-byte after QA.
- Local lint / tsc / build green (Actions stay disabled per company rule).
