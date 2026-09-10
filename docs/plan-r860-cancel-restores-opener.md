# R860 — Cancel on a confirm dialog restores its opener even while an earlier action's Undo toast is showing

Started from the two R859 leftovers: the Builder copy-delete / final-download-check dialogs under
the R858 close-frame observer, and the sticky-bar `partiallyObscured` case. The copy-delete
observer run found nothing (below); while probing the dialogs' focus behaviour a different,
reproducible defect showed up and was fixed instead. The final-download-check dialog and the
sticky-bar case remain open.

## 1. Evidence (production, R859 bundle `index-ClkmIVVF.js` / `Jobs-JSwto1pw.js` / `Builder-ukZtkvMt.js`)

### 1a. Builder copy-delete under the R858 observer — no defect

`/home/ubuntu/qa/r860-evidence.cjs`, fresh cache-disabled 375×812 and 1280×800, two probe copies
created through the real "Save as copy" input (`aria-label="Copy name"`), MutationObserver + rAF
sampler armed on the open dialog until it detaches.

| path | frames while mounted | frames with changed title / description | unmount |
| --- | --- | --- | --- |
| Delete (375 / 1280) | 8 / 8 | **0 / 0** | 97–113 ms |
| Cancel (375 / 1280) | 4 / 4 | **0 / 0** | 42–55 ms |

The dialog reads `Delete "R860 probe A"?` from first to last frame; R858's `closingChildren`
covers it. Nothing to fix there.

### 1b. Cancel while an earlier Undo toast is showing — defect

`/home/ubuntu/qa/r860-evidence-jobs.cjs`, same contexts, three real jobs tracked via
`#track-chip-saved`. Untrack job A (Saved chip → Stop tracking) so its Undo toast is on the page,
then open job B, open its Stop-tracking dialog and **Cancel**:

```
after untrack A, focus: BUTTON#undo-untrack|Undo | undo present: 1
after Cancel (button), focus: BUTTON#undo-untrack|Undo        ← A's toast, not B's Saved chip
after Cancel (Escape), focus: BUTTON#undo-untrack|Undo
control (toast dismissed first) after Cancel: BUTTON#track-chip-saved|Saved
```

Same on the Builder Resume copies dialog (Delete A → Delete B → Cancel → `#undo-copy`). Two
user-visible consequences: the user cancelled a dialog about B and is now on a control that
undoes A (Enter restores A); and the toast pauses its 10 s timer while focused (R646), so a
cancelled dialog makes the previous toast stay until the user moves away.

Cause: `focusOnClose(id)` targets `#id` whenever it exists and focus is still inside the dialog
or on `<body>`. It was written for the confirm path — the opener vanishes, the toast is the
natural landing — and assumed the toast's presence implied *this* dialog produced it. A Cancel
inside an earlier toast's 10 s window breaks that assumption. Six dialogs share the helper
(Jobs single + bulk untrack, Builder copy delete, Dashboard doc / copy / bulk delete).

## 2. Options

1. Compare the toast's payload with the dialog's subject — per-dialog code in six places, and a
   toast about A is still the wrong landing for a cancelled dialog about B even when ids match.
2. Clear the previous toast when a new dialog opens — changes Undo semantics (R646 pause contract).
3. **Chosen**: the helper only targets the Undo element when *this* dialog's action produced it.
   One flag per dialog, armed where the action succeeds, cleared on every close.

## 3. Fix

`src/lib/useFocusAfterRender.ts`:

```ts
closeFocusPlan({ activeOutsideDialog, targetPresent, confirmed })
  // keep    : focus already outside the dialog (R856, unchanged)
  // target  : confirmed && targetPresent
  // restore : otherwise (Cancel / Escape / overlay → library default: the opener)
focusOnClose(id, confirmed)
useConfirmClose(id) → { confirm, onCloseAutoFocus }   // ref armed by confirm(), read + cleared on close
```

Call sites, one hook instance per dialog, `confirm()` only after the action succeeded (`untrack()`
/ `applyVersions()` return `false` on a storage failure and the dialog then stays open):
`Jobs.tsx` `untrackClose` / `bulkUntrackClose`; `Builder.tsx` `deleteCopyClose`; `Dashboard.tsx`
`deleteDocClose` / `deleteCopyClose` / `bulkDeleteClose`. Undo / Dismiss destinations
(R646/R650/R854/R855) and the R856 fast-Tab guard are unchanged.

Tests: `tests/close-focus.test.ts` — R856 cases take the new input; +3 R860 (plan table, hook
arm/disarm shape, every call site uses the hook and confirms next to the toast) → 454.

## 4. Gates

vitest 454, `tsc -b`, `eslint src tests worker` 0 errors / 11 pre-existing warnings, build,
verify-dist 123 (`eslint .` still has the 4 pre-existing `.tmp-smoke` fixture errors, untouched).

## 5. Deploy + native re-measure

Version `c1da72e9`; production `index-BITLj7rC.js` / `Jobs-CNS0VZuB.js` / `Builder-L1_XNkvv.js` /
`Dashboard-BG27WOqz.js`, health 200. Same probes, 375×812 and 1280×800:

```
Jobs    : untrack A → #undo-untrack; Cancel on B → #track-chip-saved; toast gone at 11 s
Builder : Delete → #undo-copy (unmount 106–113 ms, 0 changed frames); Cancel → "Delete copy R860 probe B"
console errors 0, storage restored true (both widths, both routes)
```

Not covered: real devices / screen readers; Dashboard dialogs by source + unit test + independent
QA only; the final-download-check dialog and the sticky-bar `partiallyObscured` case (still open).
