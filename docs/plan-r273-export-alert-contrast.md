# R273: export-error alert light-mode contrast

## Production evidence (R271 QA)

- P3: the R271 export-error alert bars (Builder + Dashboard) use
  `text-destructive` on `bg-destructive/10`. Measured contrast in light mode is
  ~3.75:1 — below WCAG AA 4.5:1 for normal-size text (dark mode passes at
  4.94:1). `--destructive` is `oklch(0.577 0.245 27.325)` in light mode.

## Design

- Scoped fix: only the two alert bars change; the global `--destructive` token
  stays (it also colors destructive buttons with white foreground, where a
  darker red would be a different trade-off and a wider blast radius).
- Repo convention for error text is the red scale with the app's inverted dark
  palette (index.css redefines `--color-red-*` under `.dark`, e.g. red-800 is
  L 0.86 in dark), so plain `border-red-300 bg-red-50 text-red-800` is correct
  in both themes with no `dark:` overrides — same pattern as the Builder
  delete-confirm button and AtsChecker chips.
- Light: red-800 on red-50 ≈ 8.4:1. Dark: red-800 (L 0.86) on red-50 (L 0.28)
  well above AA.

## Validation

- Compute exact contrast ratios from rendered colors in production QA
  (light + dark) via CDP.
- Alert still appears/dismisses on unsupported-character PDF export in Builder
  and Dashboard (R271 regression).
- tsc/lint/build; deploy; production QA.
