# R469 — Keyboard shortcuts help dialog in the Builder

## Audit evidence (production, CDP, 2026-08-31)

- The Builder now owns a substantial shortcut set: Ctrl/Cmd+S save-flush (R468),
  Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y undo-redo (R140), Ctrl+B/I/U/K inline marks on
  every mark-capable field (R281), Escape closing panels/menus (R419/R420/R445/R447).
- None of it is discoverable: no shortcuts help surface exists anywhere
  (`document.querySelector('[aria-label*=hortcut],[title*=hortcut]')` → null on /builder),
  and only Undo/Redo mention their keys in hover titles.
- Production probe: `ctrl+/ defaultPrevented: False`, `shift+? defaultPrevented: False`
  (vs `ctrl+s: True` sanity) — the conventional "show shortcuts" keys are unhandled.
- Rezi and every mature editor (Docs, Notion, Linear, GitHub) expose a
  keyboard-shortcuts overlay, typically on Ctrl/Cmd+/ or ?.

## Gap

Users can only learn the Builder's shortcuts by accident. WCAG-adjacent
discoverability gap; also undermines the value of R140/R281/R468 work.

## Fix (minimal)

`src/pages/Builder.tsx` only:

1. `shortcutsOpen` state + a `Dialog` (existing Radix dialog components) listing
   the shortcuts in a two-column kbd table. Mod key label follows the platform
   (⌘ on macOS, Ctrl elsewhere).
2. Global keydown on the Builder: Ctrl/Cmd+/ (no Alt/Shift) toggles the dialog,
   `preventDefault()`. Removed on unmount.
3. Toolbar ghost icon button (lucide `Keyboard`) next to History,
   `title="Keyboard shortcuts (Ctrl+/)"`, hidden below `lg` (shortcuts are a
   physical-keyboard affordance; keeps the mobile toolbar from crowding).

## Non-goals

- No shortcuts overlay on other routes.
- No new shortcuts, no changes to existing handlers.
- No `?` bare-key binding (conflicts with typing in inputs).

## QA matrix

- Ctrl+/ and Cmd+/ open the dialog; same key or Esc closes it; focus returns
  per Radix defaults (R340).
- Toolbar button opens it; button visible ≥lg, absent on 375px.
- Dialog lists save/undo/redo/marks/escape rows; mod label correct for platform.
- Ctrl+Shift+/ and Alt+Ctrl+/ not intercepted; typing `/` in inputs unaffected.
- R468 Ctrl+S, R140 undo/redo, R281 marks unaffected.
- 375px light/dark zero overflow, zero console errors, no unsafe traffic,
  byte-exact storage restore.
