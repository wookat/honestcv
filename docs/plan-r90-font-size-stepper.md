# R90 — fine-grained text size stepper (Rezi parity)

## Evidence (first-hand)

- `~/audit-r1/shots-r87/finishup-base.png` + `switcher-text.txt`: the Rezi Finish Up
  toolbar has a numeric font-size stepper — `− 11 +` with accessible names
  "Decrease font size" / "Increase font size".
- Our builder only offers three pills (S/M/L → ×0.92/×1/×1.08). Users squeezing a
  resume onto one page (or filling a sparse one) have an 8% jump as the smallest
  unit; Rezi offers finer, wider control.

## Design

Smallest honest step up: extend the existing `fontScale` enum by one step on each
end and swap the pill UI for a stepper. No numeric free-form (unbounded values
break layout guarantees); existing `'s' | 'm' | 'l'` multipliers unchanged so
stored resumes render identically.

- `Resume.fontScale`: `'xs' | 's' | 'm' | 'l' | 'xl'` (optional, default `'m'`).
- `FONT_SCALE`: add `xs: 0.84`, `xl: 1.16` (s/m/l untouched).
- Sanitizer whitelist grows; unknown values still fall back to default (`m`).
- Builder: Text group becomes `A− <label> A+` stepper; label shows the current
  size as a percentage (92%, 100%, …) with the step name in the tooltip;
  buttons disable at the ends; aria-labels "Decrease text size" / "Increase
  text size"; same pill styling, wraps with the toolbar at 375px.
- Auto-fit: `FIT_COMBOS` extended with the xs/xl combos, ordered by roominess
  (fontScale × lineSpacing product, descending) so Auto-fit still prefers the
  largest layout that fits.
- Preview/PDF/DOCX need no changes: all three already consume `fontScaleOf()`
  as a pure multiplier.

## Out of scope

- Free numeric point input (Rezi caps to a slider-like range too; enum keeps the
  sanitizer and QA surface small).
- Per-section font sizes; heading/body ratio changes.

## Verification

- Local: lint, tsc -b, build, `git diff --check`.
- Production: stepper walks xs↔xl with ends disabled; preview zoom changes;
  real PDF at xs/xl shows proportionally scaled text (pdftotext/pdffonts sane);
  DOCX `w:sz` scales; refresh persists; legacy `s/m/l` resumes unchanged;
  Auto-fit still returns a valid combo; 375px no overflow; zero AI calls;
  localStorage restored byte-for-byte.
