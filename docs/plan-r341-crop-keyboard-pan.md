# R341 — keyboard panning for the photo crop area (+ close remaining keyboard coverage)

## First-hand evidence (R340 keyboard audit, production)
- Photo Crop dialog: the zoom slider is keyboard-operable (ArrowRight 1 →
  ~1.02 verified), but the crop viewport is pointer-only — `role="application"`
  div with pointer handlers, not tabbable, no arrow-key panning. A keyboard
  user can zoom but only ever gets the centered crop (ranked P3 because
  center+zoom stays usable; still the only pointer-only control in the app).
- Two areas the R340 pass never exercised: the tailoring triage card and the
  keyword bullet dialog — covered in this round's QA (audit, fix only if a
  confirmed defect emerges).

## Design (PhotoCropDialog.tsx only)
- Make the crop area focusable: `tabIndex={0}` + visible `focus-visible` ring.
- `onKeyDown`: Arrow keys pan the crop center by 8 viewport px (converted to
  source px via the existing scale `s`), Shift+Arrow by 32 px; clamp with the
  existing `clamp(…, maxX/maxY)`; `preventDefault()` so arrows don't scroll.
- Update the aria-label and helper copy to mention arrow keys.
- No change to pointer behavior, zoom, save output (256×256 JPEG), or the
  dialog contract.

## Validation
- tsc/lint/build locally.
- Production QA: keyboard-only — Tab to crop area, arrows/Shift+arrows move
  the crop (assert via saved JPEG pixels or img style offsets), clamping at
  edges, zoom slider + pointer drag regressions, R340 focus-return regression.
- Keyboard pass on tailoring triage card and keyword bullet dialog (AI calls
  intercepted; zero quota).
