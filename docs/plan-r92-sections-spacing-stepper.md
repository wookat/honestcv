# R92 — fine-grained sections-spacing stepper

## First-hand evidence

- `~/audit-r1/shots-r87/finishup-base.png` + `switcher-text.txt` (logged-in Rezi
  Finish Up toolbar): a numeric sections-spacing stepper ("1.95 / Sections
  spacing") sits next to the line-height stepper, same − / value / +
  interaction.
- HonestCV today: `sectionSpacing` is a three-value enum
  (`tight 0.6 / normal 1 / roomy 1.4`) rendered as three pills.

## Design

Mirror R90/R91: extend the enum by one bounded step on each end and swap the
pills for a stepper. No free-form numeric input. Existing `tight/normal/roomy`
multipliers unchanged so stored resumes render identically.

- `resume.ts`
  - `sectionSpacing?: 'xtight' | 'tight' | 'normal' | 'roomy' | 'xroomy'`
  - `SECTION_SPACING = { xtight: 0.35, tight: 0.6, normal: 1, roomy: 1.4, xroomy: 1.7 }`
  - default stays `normal`; sanitizer whitelist extended; unknown values fall
    back to `normal` via `sectionSpacingOf`.
- `Builder.tsx`
  - Sections group becomes `− / 0.35–1.70 / +` (multiplier display, two
    decimals), aria-labels "Decrease/Increase section spacing", ends disabled.
- Preview/PDF/DOCX: no changes — all consume the single `sectionSpacingOf()`
  multiplier (preview `16px·ss` heading margin, PDF `w.ss`, DOCX
  `round(240·ss)` twips before headings).

## Out of scope

Free-form numeric entry, per-section overrides, Indent toggle, Icons, Profile
picture, VIEW AS PAGES. Auto-fit does not use sectionSpacing (unchanged).

## Verification

Local: `npm run lint`, `npx tsc -b`, `npm run build`, `git diff --check`.
Production: stepper walk with end-disabling; preview heading margin scales;
PDF at xtight vs xroomy shows proportional heading gaps; DOCX `w:before`
values = round(240·ss); refresh persistence; legacy values unchanged; invalid
values fall back to normal; 375px no overflow; console clean; zero AI calls;
byte-level localStorage restore.
