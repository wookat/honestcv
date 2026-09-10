# R816 — Coursework / Awards / Publications / Certifications organisation field clipped its stored value

## Evidence (production R815, 375 px and 1280 px)

`qa/r816-evidence.cjs` loads `/builder` with the R815 all-sections fixture
(`/home/ubuntu/qa/r815/all-sections.json`), measures every visible text input and
compares the width of its **stored value** (canvas `measureText` with the input's own
font) with the input's inner width (`clientWidth − padding`). Storage restored, 0
console errors, `visualViewport 375 = scrollWidth 375` at 375, scale 1.

Inputs whose stored value was wider than the box (placeholder-only clipping listed
separately, not a defect):

| width | input | box / inner | text | value |
| --- | --- | --- | --- | --- |
| 375 | `Where (school or platform)` (Coursework) | 195 / 169 px | 189 px | `University of Texas at Austin` |
| 375 | `Awarded by` (Awards) | 195 / 169 px | 189 px | `University of Texas at Austin` |
| 1280 | `Where (school or platform)` | 180 / 154 px | 189 px | same |
| 1280 | `Awarded by` | 180 / 154 px | 189 px | same |

Cause (`Builder.tsx`): the four one-line structured entries put the organisation and
the date in a nested `grid grid-cols-[1fr_5rem]` (Certifications: `[1fr_auto]` + `w-24`)
which shares a `sm:grid-cols-2` row with the name. The organisation therefore gets
half the card minus an 80–96 px date box at every width — 169 px inner on a 375 px
phone, 154 px inner on desktop (the desktop card is narrower than the phone card
because of the two-pane layout). A 29-character school name does not fit; the user
sees `University of Texas at Aus` and has to scroll inside the field to check what
they typed. The same pattern sits in Publications (`Journal or conference`) and
Certifications (`Issuer`) — not clipped by this fixture's short values, same box.

R815 had measured these boxes (`Organization 283px, Issuer 179px`) and recorded "no
defect" — that scan looked at hit-area height, not at value width; this round is the
first to measure value vs. box.

Alternative candidate weighed: the mobile `EntryAuditChip` findings panel
(`fixed inset-x-4 bottom-20`) covers the Company / Location inputs of the card below
while shown (`qa/r816-audit-probe*.cjs`: top 493 / bottom 587 on a 667 px viewport).
It is dismissible with Escape since R691 and only appears on hover / focus; kept in
the queue, lower user impact than a value that is silently cut.

## Fix (Tailwind only, one shared layout)

```tsx
const ENTRY_NAME_ORG_DATE = 'grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]'
const ENTRY_NAME_FIELD = 'sm:col-span-2'
const ENTRY_DATE_FIELD = 'w-32 sm:w-24'
```

Coursework, Awards, Publications and Certifications use the same three classes: the
nested `[1fr_5rem]` row is gone, name / organisation / date are direct children of
one grid.

- below `sm`: every field stacks — the organisation gets the full card
  (283 px box / 257 px inner at 375), the date is a 128 px box on its own line;
- from `sm` up: the name spans both columns, the organisation takes the flexible
  `minmax(0,1fr)` column and the date the `auto` column (96 px).
  Publication type also spans the row (`ENTRY_NAME_FIELD`) beneath title / venue / date.

Measured (`qa/r816-geometry.cjs`, local `dist` vs production R815):

| | prod 375 | new 375 | prod 1280 | new 1280 |
| --- | --- | --- | --- | --- |
| organisation inner width | 169 | 257 | 154 | 415 |
| `University of Texas at Austin` (189 px) clipped | yes | no | yes | no |
| date box | 80 same row | 128 own row | 80 same row | 96 same row |
| name box | 283 | 283 | 268 | 545 |

Desktop cards grow by one 36 px input row per entry (name no longer shares a row with
the organisation) — accepted: the fixture's 29-character school is not an outlier for
institutions, publishers or issuers.

## Rejected

- `sm:grid-cols-[1fr_1fr_auto]` (keep name and organisation on one desktop row): the
  organisation would get ≈ 190 px inner on a 1280 desktop — `University of Texas at
  Austin` fits by 1 px, `Massachusetts Institute of Technology` does not.
- Only widening the date column ratio (`[1fr_4rem]`): 16 px more does not cover a
  35 px shortfall and squeezes years such as `Jun 2020`.
- Scrolling / ellipsis inside the input: the value is still hidden.

## Tests

`tests/entry-name-org-date.test.ts` (+3, 265 → 268): the four organisation inputs and
their name inputs are direct children of `<div className={ENTRY_NAME_ORG_DATE}>` and no
`grid-cols-[1fr_5rem]` remains; the grid has no base `grid-cols-*` (stacks below `sm`)
and `sm:grid-cols-[minmax(0,1fr)_auto]`; the name (and Publication type) carries
`ENTRY_NAME_FIELD`, the organisation carries no `className`, the following `When`
carries `ENTRY_DATE_FIELD`. All three fail on the R815 tree (checked in a throwaway
worktree).

## Not verified

- Other breakpoints between 640 and 1024 (the two-pane Builder switches at `lg`);
  the layout is the same `sm:` grid there.
- Preview / exports: untouched (form layout only, no data change).
