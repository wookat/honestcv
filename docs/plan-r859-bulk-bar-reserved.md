# R859 — the first tick in bulk mode no longer moves the rows

Carried over as an observation from R857 ("375: after the first tick the status select / Untrack N
wrap to a second row and every row moves down 48 px once"). Measured on production before any
change; the two other R859 candidates (Builder dialogs under the close-frame observer, sticky-bar
`partiallyObscured`) are still open and are measured after this one.

## 1. Evidence (production, R858 bundle `index-CJftaHDx.js` / `Jobs-D7wPKD_v.js`)

`/home/ubuntu/qa/r859-evidence.cjs <w> <h>`, fresh cache-disabled context, three real jobs tracked
through `#track-chip-saved`, `/jobs?tab=tracked&q=<no match>` so the pipeline is the only source
of rows, `Select…` clicked. Geometry of the bulk bar, the list, every checkbox label and every
row is recorded, the first checkbox is ticked, and then a tap is delivered at the centre of where
the **second** row's checkbox *was* — the natural "tick the next one" gesture.

| viewport | bar height before → after first tick | row shift | what the old second-box centre now hits | second box after the tap |
| --- | --- | --- | --- | --- |
| 375×812 | 40 → **88** | **48 px** | job-card `<div>` (row background) | unchecked |
| 768×800 | 32 → **72** | **40 px** | job-card `<div>` | unchecked |
| 1280×800 | 32 → 32 | 0 | the second checkbox | checked |

Console errors 0 at every width. Cause: `N selected`, `Move to…`, `Untrack N` and `Clear` are
rendered only while `visibleBulkIds.size > 0`; at ≤ 768 the four controls do not fit beside
`Filter tracked jobs` + `Done selecting` and wrap to a second line, so the first tick grows the
bar and pushes the list down between the user's first and second taps.

A probe-only simulation (bar `min-height` reserved to 88 px before the baseline capture) gave
shift 0 and the second box checked at 375 — the smallest fix is to reserve the action row.

## 2. Options

1. Reserve the bar height with CSS (`min-h`) — magic numbers per breakpoint, empty space with no
   affordance, still wrong if the controls wrap differently.
2. Move the action controls below the list / into a fixed bottom bar — new layout, new
   focus-order and sticky-clearance work (R658/R847 contracts).
3. **Chosen**: keep the four controls mounted for the whole Select… session and disable the three
   actions while nothing is ticked. The bar is already its final size before the first tick; the
   "0 selected" count is truthful; `Move to…` / `Untrack` / `Clear` cannot be triggered with an
   empty selection because they are `disabled`.

## 3. Fix

`src/pages/Jobs.tsx` (bulk bar): `{bulkMode && visibleBulkIds.size > 0 && (…)}` →
`{bulkMode && (…)}`; `select`, `Untrack` and `Clear` get `disabled={visibleBulkIds.size === 0}`
(+ `disabled:opacity-50`; `Clear` also `disabled:hover:no-underline`). The Untrack label comes from
`src/lib/bulkUntrackLabel.ts` — `selected > 0 ? \`Untrack ${selected}\` : 'Untrack'` — so the
disabled button does not read "Untrack 0". Status-change, bulk-untrack confirmation, Clear,
empty-state and the R857 label / `gap-4` row geometry are unchanged; desktop (1280) geometry is
unchanged because the controls already fit on one line there.

Tests: `tests/jobs-panes.test.ts` +3 (bar mounted on `bulkMode`, three `disabled` bindings, R857
row geometry kept) and `tests/bulk-untrack-label.test.ts` +2 → 451.

## 4. Gates

vitest 451, `tsc -b`, `eslint src tests worker` 0 errors / 11 pre-existing warnings, build,
verify-dist 123 (`eslint .` still has the 4 pre-existing `.tmp-smoke` fixture errors, untouched).

## 5. Deploy + native re-measure

Version `14004ec8`; production `index-ClkmIVVF.js` / `Jobs-JSwto1pw.js`. Same probe, same widths:

| viewport | bar height before → after | row shift | old second-box centre hits | second box after tap |
| --- | --- | --- | --- | --- |
| 375×812 | 88 → 88 | **0** | the second checkbox | **checked** |
| 768×800 | 72 → 72 | **0** | the second checkbox | **checked** |
| 1280×800 | 32 → 32 | 0 | the second checkbox | checked |

URL unchanged, no detail pane opened, list still visible, console 0, storage restored.
