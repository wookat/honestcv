# R826 — dated entry fields never show a quarter-width date box (1024–1215 px)

## Evidence (first-hand)

- Production (cv.zalize.com `/builder`, `qa/r818-midwidth.cjs` re-run at 768 / 1024 with the
  all-sections fixture): the generic overlap probe reported 13 / 9 / 45 / 9 rectangle
  intersections on `/builder` and `/dashboard`. Read one by one, every intersection except
  one class was a false positive (date-picker trigger sitting on its own input, entry toolbar
  inside the card button, layered preview / pane switcher). The one real class: six `clipped`
  inputs on `/builder` @1024, all month-year date fields (`Jun 2023` text 63 px in 52 px,
  `May 2023` 67 / 52, `Sep 2018` 61 / 52, `University of Texas at Austin` 189 / 178).
- Focused measurement (`/home/ubuntu/qa/r826-evidence.cjs`: every `<input>` whose next
  sibling is the `Open date picker` button; text width by canvas with the input's own font vs
  `clientWidth − padding`):

  | viewport | date inputs | clipped | usable width | note                                  |
  | -------- | ----------- | ------- | ------------ | ------------------------------------- |
  | 375      | 10          | 0       | 130          | single column (R798 stack)            |
  | 640      | 10          | 0       | 148+         | editor alone, `sm:grid-cols-2`        |
  | 768      | 10          | 0       | 170+         | editor alone                          |
  | **1024** | 10          | **5**   | **52**       | editor + preview (`lg` two columns)   |
  | 1152     | 10          | 0       | 68           | fits `May 2023` (67) by 1 px          |
  | 1280     | 10          | 0       | 84           |                                       |

  The five clipped values are the populated month-year dates (`Jun 2023`, `Jul 2021`,
  `May 2023`, `Sep 2018`, `May 2020`); bare years and `Present` fit. Root cause (source):
  each dated entry's field grid is `grid gap-2 sm:grid-cols-2`; the date pair sits in one
  half and is itself `grid grid-cols-2 gap-2`, so a date box is a quarter of the grid minus
  two gaps and the 32 px calendar button. At `lg` the editor column is 417 px @1024
  (`max-w-7xl` main split in half), so a quarter is 96 px and the text area 52 px.
- Layout simulation on production before touching source (`/home/ubuntu/qa/r826-simulate.cjs`,
  injected CSS, then re-measured):

  | viewport | grid width | clipped before → after | usable width | entry card height |
  | -------- | ---------- | ---------------------- | ------------ | ----------------- |
  | 1024     | 417        | 5 → 0                  | 52 → 158     | 120 → 184 (exp/edu), 36 → 80 (project rows) |
  | 1216     | 513        | 0 → 0                  | 76 → 76      | unchanged         |
  | 1248     | 529        | 0 → 0                  | 80           | unchanged         |
  | 1280     | 545        | 0 → 0                  | 84           | unchanged         |

  Threshold: the grid crosses 32 rem (512 px) between 1215 and 1216 px viewport, and at
  ≥ 512 px a quarter-width box already fits every English date and every `DATE_WORDS` ongoing
  word (`Aujourd'hui` 76 px is the widest; usable width is 76 at 1216).

## Decision

The field grid of every dated structured entry (experience, education, projects,
involvement, military service) becomes a size container; while the grid itself is narrower
than 32 rem, the place / organisation field and the start–end date pair each take a full
row. Everything else is untouched:

```tsx
const ENTRY_FIELDS_GRID = '@container grid gap-2 sm:grid-cols-2'
const ENTRY_WIDE_FIELD = '@max-[32rem]:col-span-full'
```

- Container query, not a viewport breakpoint: the same grid is 417 px wide at 1024 with the
  preview beside it and 560+ px at 640–1023 with the editor alone, so `lg:` / `xl:` cannot
  express "the editor column is narrow". Emitted CSS:
  `@container not (width>=32rem){.\@max-\[32rem\]\:col-span-full{grid-column:1/-1}}`.
- `col-span-full` (`1 / -1`), not `col-span-2`, so the one-column grid below `sm` gains no
  implicit second track.
- Role/company (experience) and degree/school (education) keep sharing a row. The only
  clipped value there is the fixture's `University of Texas at Austin` in the School box at
  1024 (189 px text in 178 px: the last two letters), versus 15 px missing from a 52 px date.
  Stacking that row too would cost another 64 px per card; left as a recorded boundary.
- Cost: +64 px per experience/education card and +44 px per project/involvement/military
  card at 1024–1215 px only. Measured, accepted: the alternative is an unreadable date.
- `MonthYearField` itself is unchanged (`pr-10 sm:pr-8`, 32 px button).

Rejected, and why:

- Narrower `pr-*` on the date input / smaller calendar button: buys ≤ 8 px, `May 2023`
  needs 15; the 40 px mobile hit area (R815) must stay.
- Three-column row (location | start | end) at the narrow width: location shrinks to a third
  (≈ 133 px box, ≈ 109 px usable) — `Austin, TX` fits, `San Francisco Bay Area`-length
  values clip instead.
- Stack the date pair vertically inside its half (`grid-cols-1` in the pair): usable width
  ≈ 160 px at 1024 (half = 204 px − 12 − 32), fits everything and costs +44 px instead of
  +64. Rejected for shape, not width: start-above-end beside the location is a third
  arrangement that exists nowhere else, while full rows are exactly what the `<sm` stack
  (R798) already shows — the narrow-container layout reads as "the mobile form, two dates
  side by side".
- Change the Builder `lg:` split (e.g. editor `3fr` / preview `2fr`): moves the preview and
  every other 1024 measurement for one row of inputs.
- Smaller font in date inputs: below the 14 px baseline used by every other input.

## Verification

- `tests/entry-dates-wide.test.ts` (3 tests, source-level like `tests/entry-name-org-date.test.ts`):
  the shared grid constant is a `@container` two-column grid; the wide class is exactly
  `@max-[32rem]:col-span-full`; each of the five dated entries uses the shared grid and
  applies the wide class to both the place field and the date pair; the six remaining plain
  `sm:grid-cols-2` grids (project name row, involvement role row, references, military rank
  row, agents) hold no date pair. All three fail on the R825 tree.
- Gates: `npx vitest run` 323 (320 + 3) · `tsc -p tsconfig.app.json` · `tsc -b` ·
  `eslint .` 0 errors / 11 pre-existing warnings · `npm run build` · `npm run verify-dist`
  123 URLs · built CSS contains `.\@container{container-type:inline-size}` and the
  `@container not (width>=32rem)` rule.
- Local preview (`vite preview` :4179, `qa/r826-evidence.cjs`): 375 / 640 / 768 / 1024 /
  1152 / 1215 / 1216 / 1280 → 10 date inputs, 0 clipped at every width; usable width 158 @1024,
  76 @1216 (unchanged), 84 @1280 (unchanged).
- Deploy: `npm run deploy`, then compare production `Builder-*.js` / `style-*.css` SHA-256
  (names discovered from the no-cache production HTML → bundle) with `dist/client/assets`.
- Production QA (testing agent, independent, 375×667 and 1280×800 plus a 1024×768 pass for
  the changed band): populated `Jun 2023` / `May 2023` / `Sep 2018` and `Present` fully
  visible in experience, education, project, involvement, military date boxes; calendar
  button opens / picks / closes; typing into a date box keeps the value; 1280 and 375
  geometry unchanged versus R825 (two-column row at 1280, stacked at 375); no horizontal
  overflow; stored resume JSON byte-identical after read-only steps; console / page / request
  / download counts; axe on the open Builder; storage restored.
