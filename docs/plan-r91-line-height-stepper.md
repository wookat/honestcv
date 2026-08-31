# R91 — fine-grained line-height stepper

## First-hand evidence

- `~/audit-r1/shots-r87/finishup-base.png` + `switcher-text.txt` (logged-in Rezi
  Finish Up toolbar): a numeric line-height stepper ("1.85 / Line height") sits
  next to the font-size stepper, with the same − / value / + interaction.
- HonestCV today: `lineSpacing` is a three-value enum
  (`compact 1.22 / normal 1.35 / relaxed 1.52`) rendered as three pills.

## Design

Mirror R90 exactly: extend the enum by one bounded step on each end and swap
the pills for a stepper. No free-form numeric input — unbounded values break
the layout guarantees the Auto-fit page counter relies on. Existing
`compact/normal/relaxed` multipliers are unchanged so stored resumes render
identically.

- `resume.ts`
  - `lineSpacing?: 'xtight' | 'compact' | 'normal' | 'relaxed' | 'loose'`
  - `LINE_SPACING = { xtight: 1.12, compact: 1.22, normal: 1.35, relaxed: 1.52, loose: 1.65 }`
  - default stays `normal`; sanitizer whitelist extended; unknown values fall
    back to `normal` via `lineSpacingOf`.
- `Builder.tsx`
  - Spacing group becomes `− / 1.12–1.65 / +` (display the multiplier like
    Rezi's "1.85"), aria-labels "Decrease/Increase line spacing", ends disabled.
  - `FIT_COMBOS` stays on the middle three spacings (deliberate: 5×5 = 25 PDF
    renders per Auto-fit is too slow, and `xtight`/`loose` are aesthetic
    extremes users pick manually, not fit targets). Auto-fit still returns a
    valid combination and still prefers the largest layout that fits.
- Preview/PDF/DOCX: no changes — all consume the single `lineSpacingOf()`
  multiplier.

## Out of scope

Free-form numeric entry, per-section line heights, Rezi's separate numeric
sections-spacing stepper (our `sectionSpacing` enum stays as-is this round),
Indent toggle, Icons, Profile picture.

## Verification

Local: `npm run lint`, `npx tsc -b`, `npm run build`, `git diff --check`.
Production: stepper walk with end-disabling; preview line height changes;
PDF at xtight vs loose shows proportional line advance; DOCX line spacing
metadata scales; refresh persistence; legacy `compact/normal/relaxed`
unchanged; invalid values fall back to normal; Auto-fit regression; 375px no
overflow; console clean; zero AI calls; byte-level localStorage restore.
