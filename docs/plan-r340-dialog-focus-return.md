# R340 — restore focus to the opener when a dialog closes

## First-hand evidence (production, R340 keyboard audit)
- Bundle `index-D2cmkAAo.js`. Reproduced on Share link, Interview Prep,
  Photo Crop and Template Compare dialogs: Escape (and other close paths)
  closes the dialog but `document.activeElement` lands on `BODY`, not the
  button that opened it. A keyboard user loses their place every time.
- Root cause (source-confirmed): every dialog in the app is *controlled*
  (`open={state}` set from plain Buttons) — none uses Radix `DialogTrigger`.
  Radix's built-in close autofocus returns focus to its Trigger; with no
  Trigger it falls back to the body.

## Design
One change in the shared `src/components/ui/dialog.tsx` `DialogContent`
(fixes every dialog at once, no per-page edits):
- On `onOpenAutoFocus` (fires before Radix moves focus into the dialog),
  capture `document.activeElement` as the opener.
- On `onCloseAutoFocus`, if the captured opener is still connected to the
  document, `preventDefault()` Radix's body fallback and focus the opener.
- Caller-supplied `onOpenAutoFocus`/`onCloseAutoFocus` props still run first;
  if a caller calls `preventDefault()` in `onCloseAutoFocus`, we respect it
  (repo currently has zero such callers — grep-verified).
- If the opener was removed while the dialog was open (e.g. conditional
  toolbar button), behavior falls back to Radix default — no crash.

## Non-goals
- Photo-crop keyboard panning and undo/status-bar tab order (other R340 P3
  candidates) — separate rounds.
- No behavior change for mouse users beyond the (correct) focus return.

## Validation
- tsc / lint / build locally.
- Production QA: for Share, Interview Prep, Photo Crop, Template Compare —
  open via keyboard, close via Escape / X / Cancel, assert
  `document.activeElement` is the opener button. Regression: focus trap and
  first-field autofocus inside dialogs unchanged; R333 unsaved-work confirm
  keeps working. Zero AI, baselines restored.
