# R815 — Builder editor controls that were still under 40px on touch widths

## Evidence (production R814, 375 px)

`qa/r815-probe.cjs` loads `/builder` with a fixture that populates every structured
section (`/home/ubuntu/qa/r815/all-sections.json`) at 375×667 (`visualViewport 375`,
`scrollWidth 375`, storage restored, 0 console errors) and measures every visible
control's bounding box. Since R651–R657 the product's mobile hit-area convention is
40px (`h-10 sm:h-7`, `min-h-10 sm:min-h-8`, `INLINE_ACTION`, dialog Close ×, keyword
chips 32px by design). Controls that had not been brought under that convention:

| control | measured | where |
| --- | --- | --- |
| Contact Hide/Show eye toggles (5) | 24×24 | `Builder.tsx` `className="h-6 w-6 shrink-0 p-0"` |
| Date-picker trigger (every `MonthYearField`, 10 in the fixture) | 36×32 | `MonthYearField.tsx` `inset-y-0 … w-8` |
| Education Move up / down / Duplicate / Save / Delete, project Delete, custom "Delete section", Save summary / Save skills to library | 36 tall | `className="h-9 …"` with no `sm:` split (the experience toolbar already uses `h-10 sm:h-7`) |
| Add role / Add education / Add project / Add custom section, and the summary / experience / education / project / skills "From library" buttons | 32 tall | `size="sm"` only, while the seven R797/R798 structured sections' Add / From library buttons already carry `min-h-10 sm:min-h-8` |
| "Need ideas? Show bullet starters" | 32 tall | `min-h-8` at every width |

Everything else under 44px in the scan is either the R657 keyword chips (32px by
decision) or a text field whose width is set by the form column, not a hit-area
defect (`Organization` 283px, `Issuer` 179px — the queued "institution box 180px"
candidate did not reproduce as a defect: the field is full-width on its own row and
its height is the 36px input, the same as every other input).

## Fix (Tailwind only, desktop unchanged)

- Contact eye toggles: `size-10 -my-2 -mr-2 … sm:m-0 sm:size-6` — 40×40 hit box on touch
  widths, the negative margins keep the row height and the icon position exactly where
  they were (same trick as `INLINE_ACTION`).
- `MonthYearField`: trigger `w-10 -inset-y-0.5 … sm:inset-y-0 sm:w-8`, input
  `pr-10 sm:pr-8` so typed text never sits under the wider trigger.
- Toolbar buttons: `h-9` → `h-10 sm:h-9` (9 call sites).
- Add / From library: `min-h-10 sm:min-h-8` on the 9 buttons that lacked it — the same
  class the other structured sections already use.
- Bullet starters toggle: `-my-2.5 py-2.5 min-h-10` on touch widths, the previous
  `-my-1.5 py-1.5 min-h-8` from `sm:` up — the line box it sits in does not change.

## Rejected

- Changing `Button size="sm"` globally to `h-10 sm:h-8`: would touch every page (header,
  dialogs, jobs board, dashboard rows) without per-site evidence; the product has opted
  in per call site since R651 and several tight rows (chips, inline rows) rely on 32px.
- Widening the `Organization` / `Issuer` / `Institution` inputs: no defect measured.

## Tests

`tests/touch-targets.test.ts` (+5, 260 → 265): every Builder `<Button size="sm">` whose
label is `Add …` / `From library (` carries a mobile min-height and an `sm:` reset; no
Builder button is a fixed `h-9`; the contact toggle is `size-10 -my-2 … sm:size-6`;
`MonthYearField` renders `w-10 -inset-y-0.5 sm:inset-y-0 sm:w-8` and the input
`pr-10 sm:pr-8`. All five fail on the R814 tree (checked in a throwaway worktree).
