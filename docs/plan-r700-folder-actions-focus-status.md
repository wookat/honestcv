# R700 — dashboard folder actions (move / bulk move / remove from folder / rename folder / remove folder) drop keyboard focus to body and announce nothing

## Evidence (production index-BqdrLUVG.js, `qa/r700-evidence.cjs 1280`)

MutationObserver over every live region + 100 ms `activeElement` poll, keyboard `Enter` on the trigger, then the dialog action.

| action | live-region mutations | focus after the dialog closes |
| --- | --- | --- |
| Move "Alpha role" → **Create & move** "QA folder" | none | **body** |
| Move "Beta role" → existing folder "Sales" | none | **body** |
| Move "Beta role" → **Remove from folder** | none | **body** |
| Rename folder "Sales" → "Sales 2" | none | **body** |
| Select 2 copies → Move to folder… → "Sales 2" | only the existing bulk counter `0 selected` | **body** |

Why: every one of these re-keys the DOM the trigger lived in — the copy row re-mounts under another `<section key={folder}>`, the folder heading section is keyed by its name, and the bulk toolbar's "Move to folder…" unmounts when `bulkSelected` empties — so Radix's return-focus target is gone by the time the dialog closes and focus lands on `<body>` (WCAG 2.4.3). Nothing tells an AT user where the copy / folder went (4.1.3). Edit name / Rename document (R699 evidence) are not affected because the row stays keyed by the copy id.

## Fix (Dashboard.tsx only)

- `folderId(f) = 'folder-' + encodeURIComponent(f)`; the folder heading toggle gets `id={folderId(f)}`.
- `moveVersionTo`: after `applyVersions` succeeds, `announce()` (the R699 region) —
  - single: `“Alpha role” moved to “QA folder”.` / `“Beta role” removed from its folder.`
  - bulk: `2 copies moved to “Sales 2”.` / `2 copies removed from their folders.`
  - `focusAfterRender(...movedIds.map(id => `copy-${id}-open`), folder ? folderId(folder) : 'main', 'main')` — first moved row's Open button; falls back to the destination folder heading when the row is hidden (collapsed folder / folder filter), then `#main`.
- `renameFolder`: announce `Folder “Sales” renamed to “Sales 2”.`, focus `folderId(to)` → `main`.
- `removeFolder`: announce `Folder “X” removed — N copies are no longer in a folder.`, focus first former member's Open → `main`.
- No change to the mutation helpers, dialog copy, storage or visible layout; the storage-full branch still only raises `storageError`.

## Validation

tsc / eslint / `git diff --check` / build / verify-dist; deploy; `qa/r700-verify.cjs 1280|375`: each of the five actions yields exactly one `status` mutation with the expected text and ends with focus on the expected `#copy-…-open` / `#folder-…` in view; storage back to baseline; 0 console errors.

## Not verified

Real screen-reader output; collapsed-folder / folder-filter fallback paths are exercised by code only.
