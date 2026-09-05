# R468 — Ctrl/Cmd+S in the Builder saves instead of opening the browser dialog

## Evidence (first-hand, production 2026-08-31)

- SOP-10 four-dimension sweep first (all clean): 7 SPA routes desktop + 375px —
  zero console errors, zero overflow, one h1 each, zero unnamed buttons
  (`audit-r1/r468_audit.py`; the 16 "no-alt" /jobs images are `alt=""`
  decorative logos — correct, not a defect); all 123 sitemap pages 200 and all
  135 internal hrefs 200; security headers (CSP/HSTS/nosniff/XFO) and og meta
  present on SPA + static pages.
- Gap: `audit-r1/r468_ctrls.py` on https://cv.zalize.com/builder — a synthetic
  `keydown` Ctrl+Z is `defaultPrevented: true` (undo hook), Ctrl+S is
  `defaultPrevented: false`. Nothing in the app handles Ctrl/Cmd+S, so the
  browser's "Save page as…" dialog interrupts the editing session — the single
  most ingrained editor habit while writing a document. Every serious editor
  (Google Docs, Notion, Rezi's builder) intercepts it.

## Fix (smallest idiomatic)

`useDebouncedSave` in `src/pages/Builder.tsx` already owns the pending-save
state and a `flush()` used on pagehide/visibilitychange. Add one keydown
listener in that hook:

- Ctrl/Cmd+S (no Alt/Shift) → `e.preventDefault()` always (never show the
  browser dialog on /builder), then flush any pending debounced save
  immediately via the exact same `saveResume` + `syncActiveVersion` +
  `recordResumeSnapshot` funnel, and set the indicator state (`saved`/`error`)
  so the existing R351 save-state indicator tells the truth ("Saved" or
  "Not saved — storage full").
- No new UI: the toolbar indicator already displays Saving…/Saved/error and is
  the honest confirmation surface.

## Non-goals

- No Ctrl+S handling on other routes (nothing autosaves there).
- No "save as copy" dialog on Ctrl+S — copies are an explicit Copies-dialog
  action; Ctrl+S maps to the autosave funnel.

## QA matrix

1. Ctrl+S (and Cmd+S) on /builder → no browser save dialog; defaultPrevented.
2. Type, press Ctrl+S within the 400ms debounce → draft persisted immediately
   (localStorage value reflects the keystroke without waiting), indicator
   "Saved".
3. Ctrl+S while idle (nothing pending) → no-op besides preventDefault; no
   errors.
4. Ctrl+S inside inputs/textareas/dialogs → still intercepted, no dialog.
5. Storage full → Ctrl+S surfaces the existing "Not saved — storage full"
   indicator.
6. Ctrl+Shift+S / Alt+Ctrl+S not intercepted.
7. Regressions: Ctrl+Z/Y undo-redo, mark shortcuts Ctrl+B/I/U/K in fields,
   R351 indicator, 375px light/dark, zero console errors, no unsafe traffic,
   byte-identical storage restore.
