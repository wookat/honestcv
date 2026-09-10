# R854 — Undo after "Stop tracking" hands keyboard focus to the restored job

## Evidence (production, R853 bundle `index-BvvI9LBO.js` / `Jobs-D-590HBO.js`, fresh cache-disabled contexts)

Fixture: save two jobs from All jobs via the pane's `Saved` status chip, then open
`/jobs?tab=tracked&q=qzxv-nomatch-r854` so the pipeline is the rows' only source.
Open the second tracked row, press its `Saved` chip again, confirm "Stop tracking".

| step | 375×812 | 768×800 | 1280×800 |
| --- | --- | --- | --- |
| open row | pane, Back visible (single pane) | same | split pane, row keeps focus |
| confirm dialog | focus `Cancel` | `Cancel` | `Cancel` |
| after untrack (immediate = settled) | rows 2→1, pane closed, focus `#undo-untrack` | same | rows 2→1, focus `#undo-untrack` |
| Tab | `Dismiss` | `Dismiss` | `Dismiss` |
| **Undo** | rows 1→2, **focus `<body>`** | **`<body>`** | **`<body>`** |
| Undo + Tab | **`Skip to content`** (document top) | same | same |
| Undo + Tab Tab | `RezUp by Zalize` brand link | same | same |
| 2nd untrack → Dismiss | focus neighbour row `job-card-2091087` | same | same |
| Dismiss + Tab | that row's `Saved` action | same | same |

Page Y after untrack (366→286, 276→67, 124→50) is the list reflowing after the pane
closes / row leaves — not a separate defect (list restore was measured in R850/R853).
Console errors: 0 on every run.

## Root cause

```tsx
const restored = undoUntrack.find((r) => r.entry.job.id === selected?.id)
if (restored) focusAfterRender(`track-chip-${restored.entry.status}`)
```

`selected` is derived from `shown ?? jobs ?? pipeline ?? linkedJob`. When the untracked
job was in no list (Tracked tab + non-matching search, or a feed that no longer carries it)
it is `null` by the time Undo is clicked, so nothing is queued; the toast unmounts and
focus falls to `<body>`. Dismiss uses a pre-computed neighbour list and is unaffected.

## Fix (Jobs.tsx, Undo handler only)

```tsx
const restoredId = selectedId ?? selected?.id
const restored = undoUntrack.find((r) => r.entry.job.id === restoredId)
if (restored)
  focusAfterRender(`track-chip-${restored.entry.status}`, `job-card-${restored.entry.job.id}`)
```

- `selectedId` outlives the row; `selected?.id` keeps the implicit-first-row case.
- `useFocusAfterRender` takes the first id that actually receives focus. The pane is
  `hidden lg:block` on a single pane, so the chip rejects focus there and the restored
  **row** wins (matching R853's Back-to-list contract); on the desktop split pane the
  restored job is shown again and its **status chip** wins (the control the user pressed).
- Rejected: reopening the pane on a single pane after Undo (R650 chose the list, and
  Undo should restore the list row, not navigate); focusing the neighbour (Dismiss
  semantics — the restored job is the object of the action).

## Validation

vitest 433 (431 + 2, both fail on the R853 tree), tsc -b, eslint 0 errors / 11
pre-existing warnings, build, verify-dist 123.
