# R834 — entry toolbar buttons are 40 px wide (not 38) on touch widths

## Evidence (first-hand, production R833 bundle `125d02ff`)

- Found by the R833 independent QA and re-measured with `/home/ubuntu/qa/r834-headers.cjs` /
  `r834-rows.cjs` (R815 all-sections fixture, real Chrome, CDP): every icon-only toolbar button on a
  structured entry — Move up / down, Duplicate, Save to / Remove from library, Hide / Show, Delete,
  Collapse / Expand, plus the section-level `Delete section` / library `Remove` — measures
  **38 × 40 px at 375** (Experience / Education 7-button header rows, Involvement 5, Military 4,
  Coursework / Awards / Publications / Certifications / References 5, custom sections). R815 asserted
  the mobile *height* only (`h-10` / `min-h-10`); the width is the shared `Button size="sm"` box —
  `px-3` (24 px) + a 14 px `size-3.5` icon = 38 px. Desktop is 38 × 28 (`sm:h-7`) or 38 × 36
  (`sm:h-9` / `sm:min-h-9`) and is not in question.
- WCAG 2.5.8 (24 px) is met; the product's own rule since R651–R657 / R815 is a 40 × 40 hit area
  below `sm`, and every neighbouring control (contact eyes `size-10`, calendar trigger `w-10`,
  library Pencil / Copy `w-10`) already has it — so this is the last 2 px of an internal
  inconsistency, not a new standard.
- Row budget at 375 (usable card width 268 with a native scrollbar, 283 without): the two
  seven-button header toolbars (Experience, Education) are `7 × 38 + 6 × 4 = 290 − 24 = 266` px wide
  and fit on one line with 2 px to spare; at 40 px they need `280` px → wrap to two rows and add
  40 px to each card. Simulated on production before touching source (`r834-headers.cjs` A / B
  variants): letting the toolbar row use the card's 6 px inner gutter on each side (`-mx-1.5`,
  `basis calc(100% + 0.75rem)`) gives 280 px and keeps the single row at 375; at 360 the row was
  already two lines before and stays two lines (no extra height). `scrollWidth === clientWidth` at
  375 / 360 / 1024 / 1280 in every variant.

## Design

- Add the existing scoped convention `min-w-10 sm:min-w-0` to every entry / section toolbar
  button — the five class patterns R815 created (`h-10 sm:h-7`, `h-10 sm:h-9`, `h-10 shrink-0
  sm:h-9`, `-my-2 h-10 shrink-0 sm:h-7`, `min-h-10 shrink-0 sm:min-h-9`, each with and without
  `text-destructive`). Mobile box 40 × 40; above `sm` the min width resets so desktop stays 38 px
  wide and the icon geometry / spacing is byte-identical.
- The two seven-button header rows (`ml-auto flex items-center max-sm:basis-full …`) gain
  `max-sm:-mx-1.5 max-sm:basis-[calc(100%+0.75rem)]` — mobile-only, the row bleeds into the card's
  6 px padding on both sides so seven 40 px buttons + six 4 px gaps (280 px) still fit the 268 px
  content box on one line at 375. Nothing changes at ≥ sm.
- Rejected: changing `Button size="sm"` (`px-3`) globally — it would widen every compact text and
  icon button in dialogs, navigation, history, calendar and Skills chips; a per-button
  `w-10` (breaks the desktop 38 px reset and the `sm:h-7` rows' `px-3` text buttons share the
  size); shrinking the icon gap (`gap-1` → 0 saves 24 px but the R702 move announcements depend on
  the same row; not needed once the gutter is used).
- Out of scope, on purpose: header history / undo / redo (`sm:min-h-8`, sized in R658), the
  download button, contact eye buttons (`size-10`), library Pencil / Copy (`w-10`), text buttons.

## Tests (348 → 352, `tests/touch-targets.test.ts`)

- A brace-aware `<Button …>…</Button>` scanner (the R815 regex stopped at the first `>` inside an
  `onClick={() => …}` and missed the toolbars whose handlers come before `className`).
- `entryToolbarButtons()` = icon-only `size="sm"` buttons with a 40 px mobile height and a
  `sm:h-7` / `sm:h-9` / `sm:min-h-9` desktop height, excluding explicit `w-10` controls — 75 buttons
  covering ArrowUp / ArrowDown / Copy / Trash2 / Eye / EyeOff / BookmarkPlus / ChevronDown.
- Every one declares `min-w-10` **and** `sm:min-w-0`; `button.tsx` `size="sm"` is still
  `h-8 rounded-md px-3 text-xs` with no min width; exactly two header rows carry the mobile gutter
  bleed. On the R833 tree: 75 offenders + missing gutter → 2 of 4 fail.
- Gates: vitest 352, `tsc -p tsconfig.app.json`, `tsc -b`, eslint 0 errors / 11 pre-existing
  warnings, build, verify-dist 123. `Builder.tsx` diff 77 / 77 lines, class attributes only.

## Local re-measure (Vite preview of the built dist, `r834-headers.cjs` / `r834-rows.cjs`)

| viewport | 7-button header row | entry toolbars | desktop |
| -------- | ------------------- | -------------- | ------- |
| 375      | 7 × **40 × 40**, 280 px, **1 line**, card 294 wide | all **40 × 40**, 1 line | — |
| 360      | 7 × 40 × 40, 2 lines (was 2 lines) | all 40 × 40 | — |
| 1024     | — | — | 38 × 28 / 38 × 36, rows 266 px, unchanged |
| 1280     | — | — | 38 × 28 / 38 × 36, unchanged |

`scrollWidth === clientWidth` at every width; console 0.

## Deploy + verification

- See the R834 entry in `docs/handoff-context.md` (version, production asset SHAs, independent QA).
