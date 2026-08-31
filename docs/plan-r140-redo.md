# R140 — Redo for the Builder (undo's missing half)

## Audit evidence (Rezi, live DOM, 2026-08-31)

Rezi's dashboard card **History** submenu offers **Undo / Redo / Versions**
(first-hand DOM audit of the card "…" menu on
`/dashboard/resumes`). RezUp has global undo (Ctrl/Cmd+Z + toolbar button,
`useUndo` in Builder) and a Versions/history dialog — but **no redo**: one
Ctrl+Z too many and the change is gone for good, since undo pops the only
stack. Redo is the standard escape hatch every editor pairs with undo.

## Change (zero schema, zero deps, zero storage)

- `useUndo` in `src/pages/Builder.tsx` grows a `future: Resume[]` stack:
  - `undo()` pushes the current state onto `future` before restoring.
  - `redo()` pops `future`, pushes the current state back onto `history`,
    restores. Same 50-entry cap.
  - Any fresh edit (a snapshot push) clears `future` — the usual
    linear-history semantics.
- Keyboard: Ctrl/Cmd+Shift+Z and Ctrl/Cmd+Y trigger redo, with the same
  input/textarea guard as undo (native field undo/redo stays untouched).
- Toolbar: a Redo button (Redo2 icon) next to the existing Undo button,
  disabled when `future` is empty.

## Out of scope

- No persisted history (in-memory per Builder mount, same as undo today).
- Versions dialog, dashboard, share page untouched.
- No schema, localStorage, or dependency changes.
