# R856 — a closing confirm dialog leaves focus where the user already put it

Carried over from the R855 independent QA: pressing Tab → Dismiss → Enter about 120 ms after
confirming the bulk "Stop tracking" dialog *restored* the rows instead of dismissing the toast.
The R855 harness had not logged the keydown target, so the first step was evidence.

## 1. Evidence (production, R855 bundle `Jobs-CtZAIQE0.js`, 1280×800)

`/home/ubuntu/qa/r856-evidence.cjs`: three real jobs tracked via the pane's `#track-chip-saved`,
`/jobs?tab=tracked&q=<no match>` so the pipeline is the rows' only source; capture-phase trusted
`focusin` / `keydown` log plus a `MutationObserver` on the dialog's `data-state` / detachment.

Single (keyboard confirm) and bulk (pointer confirm, `Untrack 2`) produced the same trace:

```
  +1 ms  keydown Enter  BUTTON[Stop tracking]
 +20 ms  focusin Undo                    ← the action's focusAfterRender('undo-untrack')
 +22 ms  dialog data-state=closed        (still mounted for its close animation)
 +86 ms  keydown Tab  → focusin Dismiss  ← user moves on
+232 ms  dialog detached → focusin Undo  ← onCloseAutoFocus steals focus back
         Enter → Undo fires, rows restored
```

Control: Tab 600 ms after confirming (dialog already detached) kept Dismiss and Enter dismissed
to the neighbour row. So the defect is the delayed dialog focus-restoration, not a data race
(the untrack itself and the Undo data both behave).

Mechanism: Radix `FocusScope` dispatches `focusScope.autoFocusOnUnmount` when the dialog
unmounts (after the ~200 ms exit animation); `DialogContent onCloseAutoFocus` receives it.
Our shared handler `focusOnClose('undo-untrack')` always did `preventDefault(); el.focus()` when
the Undo toast existed — unconditionally, regardless of where the user had moved focus since.

## 2. Options

| option | verdict |
| --- | --- |
| Keep `focusOnClose` as is | rejected — Enter on Dismiss undoes; keyboard users cannot dismiss quickly |
| Skip the handler when the toast already holds focus, else focus Undo | rejected — still steals focus from Dismiss / anything else the user tabbed to |
| **Decide from the live `document.activeElement`: keep focus that already sits outside the closing dialog; otherwise focus the toast; otherwise let the library restore the opener** | **chosen** — smallest change, one shared helper, both dialogs covered, Cancel path untouched |
| Delay `focusAfterRender('undo-untrack')` until the dialog detached | rejected — 200 ms of no focus after the click; R646/R854/R855 contracts assume immediate Undo focus |
| Disable the dialog exit animation | rejected — visual change unrelated to the defect |

## 3. Fix (`src/lib/useFocusAfterRender.ts` only)

```ts
closeFocusPlan({ activeOutsideDialog, targetPresent }) →
  activeOutsideDialog ? 'keep'     // Dismiss / Undo / wherever the user tabbed: preventDefault, no focus()
  : targetPresent      ? 'target'  // focus still inside the dialog or on body → focus #undo-untrack (as before)
  :                      'restore' // no toast (Cancel path) → library default restores the opener
```

`activeOutsideDialog` = `activeElement` is an `HTMLElement`, not `document.body`, and not inside
`event.currentTarget` (the closing dialog). `Jobs.tsx` unchanged; Undo / Dismiss destinations
(R650 / R854 / R855) unchanged.

Tests `tests/close-focus.test.ts` +3 (440): the decision matrix and the handler's source contract
(the vitest environment is node, so DOM-event integration is asserted structurally).

Gates: vitest 440, `tsc -b`, `eslint src tests worker` 0 errors / 11 pre-existing warnings,
build + verify-dist 123. `eslint .` also reports 4 pre-existing errors in the tracked legacy
fixtures `.tmp-smoke/r345_oracle.ts` / `r346_oracle.ts` (untouched by this round).

## 4. Production verification (deploy `a93c6290`, `index-CUXMwpSn.js` / `Jobs-DmV8mTLa.js`)

`/home/ubuntu/qa/r856-verify.cjs` at 1280×800 and 375×812 (fresh contexts, storage restored):

| path | result |
| --- | --- |
| A single, Enter then Tab at +60 ms | Dismiss keeps focus through `detached` (+230 ms); Enter → dismissed, focus neighbour row |
| B bulk, click then Tab at +60 ms | Dismiss keeps focus; Enter → dismissed, focus `main` (list empty) |
| D single, no Tab | Undo focused at +14 ms and still after detach; Enter restores → `track-chip-saved` (1280) / restored `job-card-…` (375) |
| E Cancel | detach → focus back on `#track-chip-saved` (default restore) |
| F Tab at +600 ms | Dismiss keeps focus; Enter → neighbour row |

Independent QA (testing agent, 1280×800 + 375×812, 16 scenarios / 155 assertions, recordings
`/home/ubuntu/qa/r856-qa/r856-{1280,375}-readable.mp4`): all pass, no new defect; bulk Cancel
restores its real opener `Untrack 2`; R853 Back-to-list and R855 bulk Undo unchanged.

Not covered: physical devices / screen readers.
