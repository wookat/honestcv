# R858 — a closing dialog keeps showing what it showed while open

Carried over from R857's independent QA, which noticed the bulk Stop-tracking title flash to
"Stop tracking 0 jobs?" during the close animation. Measured on production before any change.

## 1. Evidence (production, R857 bundle `index-DGGMRCUQ.js` / `Jobs-Cn_nszOk.js`)

`/home/ubuntu/qa/r858-evidence.cjs`, fresh cache-disabled 375×812 context, three real jobs
tracked through `#track-chip-saved`, `/jobs?tab=tracked&q=<no match>`. Before the confirm click a
`MutationObserver` (subtree text + `data-state`) and a `requestAnimationFrame` sampler are armed on
the open dialog node and run until it detaches; each frame records title, description, `data-state`
and computed opacity.

| dialog | title while open | title after confirm, until unmount | wrong frames |
| --- | --- | --- | --- |
| bulk (`Untrack 2` → Stop tracking) | `Stop tracking 2 jobs?` | `Stop tracking 0 jobs?` | 3 of 6 mounted frames, first at opacity **1.00** (`data-state=closed`) |
| single (pressed `Saved` chip → Stop tracking) | `Stop tracking "Senior AI Engineer – Notebooks"?` | `Stop tracking ""?` — and the description became `…deletes . Targeted resume copies…` | 2 of 5 mounted frames, first at opacity **1.00** |

So it is not a sub-frame artefact: the first rendered frame after the click is the dialog at full
opacity with empty content, and it stays wrong for the whole fade. Cause: the confirm handlers
untrack and clear the state the dialog reads (`setBulkIds(...)`, `setConfirmUntrack(null)`) in the
same click that sets `open=false`, while Radix keeps `DialogContent` mounted for its ~200 ms exit
animation and React re-renders it against the cleared state.

Same shape elsewhere (source read, not exercised): Dashboard `Delete "{confirmDelete?.name}"?`,
`Delete "{confirmDeleteDoc?.title}"?`, `Delete {bulkSelected.length} copies?`,
`Remove folder "{confirmRemoveFolder}"?`, `Open "{confirmOpen?.name}"?`; Builder copy-delete.

Not measured: whether a screen reader announces the change (the dialog is already `closed` and
its title is not a live region — inference: unlikely to be announced; the visible flash is the
confirmed defect).

## 2. Options

1. Snapshot the count / name in each handler before clearing (`Jobs.tsx` ×2, `Dashboard.tsx` ×5,
   `Builder.tsx` ×1) — eight edits, and the next dialog written the natural way regresses.
2. Delay clearing the state until the dialog has detached — changes when the Undo toast / list
   updates appear; the R854–R856 focus choreography depends on the current order.
3. Disable the exit animation — visual change for every dialog.
4. **Chosen**: in the shared `DialogContent`, render the children of the last *open* render while
   `open === false`. One place, no per-dialog code, exit animation and handler order unchanged.

## 3. Fix

`src/components/ui/dialog.tsx`: `Dialog` publishes its `open` prop through `DialogOpenContext`;
`DialogContent` keeps `lastOpen` (derived state, updated during any open render) and renders
`closingChildren(open, children, lastOpen)` — `src/lib/closingChildren.ts`, a pure function:
`open === false ? lastOpen : current`. Uncontrolled dialogs (`open` undefined) pass through.
Every dialog in the app is controlled (`<Dialog open=…>`), including the three `open` literals.

Consequence worth knowing: during the 200 ms close the dialog's buttons carry the closures of the
last open render. Today they carry the cleared-state closures; either way the dialog is closing.

Tests: `tests/dialog-closing-children.test.ts` +3 (446) — pure function, context wiring, snapshot
+ render of `shown` instead of `children`.

## 4. Gates

vitest 446, `tsc -b`, `eslint src tests worker` 0 errors / 11 pre-existing warnings, build,
verify-dist 123 (`eslint .` still has the 4 pre-existing `.tmp-smoke` fixture errors, untouched).

## 5. Deploy and native re-measure

Deploy `aad2b053`; production `index-CJftaHDx.js` / `Jobs-D7wPKD_v.js`, health 200. Same probe,
375×812: bulk — one distinct title `Stop tracking 2 jobs?` across all 6 mounted frames; single —
one distinct title and one description across all 4 mounted frames; storage restored byte-exact;
console 0.

## 6. Independent QA

Pending (testing agent): Jobs single + bulk at 375 / 1280, Dashboard delete / bulk delete / remove
folder titles during close, R856 rapid Tab → Dismiss and R854/R855 Undo focus unchanged, Cancel
path, reopen for a different item shows the new item immediately.
