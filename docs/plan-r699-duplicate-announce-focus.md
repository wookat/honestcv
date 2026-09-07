# R699 — Duplicate copy / Duplicate document: silent, and the new row lands at the top of the list out of view

## Evidence (production index-xp_sG4wv.js, `qa/r699-evidence.cjs 1280|375`)

MutationObserver over every `[aria-live] / [role=status] / [role=alert]` + 100 ms `activeElement` poll, keyboard `Enter` on the control.

| action | live-region mutations | focus after | where the result lands |
| --- | --- | --- | --- |
| dashboard **Duplicate** (copy #4 of 4) | none | stays on the original row's Duplicate button | new copy "Delta role (2)" is prepended: row 1 of the grid; at 375 its Open button is at top −974 (three rows above the viewport) |
| /documents **Duplicate** (doc #3 of 3) | none | stays on the original row's Duplicate button | new doc "Cover three (2)" is prepended to the list |
| dashboard Move to folder → "Create & move" | none | **body** (row re-mounts under the new folder group; Radix has no trigger to return to) | row moves to the new group |
| dashboard Edit name → Save | none | back to the Edit button (Radix) | row updates in place |
| /documents Rename → Save | none | back to the Rename button (Radix) | row updates in place |

`duplicateResumeVersion` / `duplicateCareerDoc` both return `[copy, ...existing]`, so the copy is always the first item and always renders above the row the user acted on. For a screen-reader or keyboard user the action produces no feedback at all (WCAG 4.1.3) and the new object is somewhere above, unreached (2.4.3).

Edit/Rename are in-place changes the user explicitly confirmed in a dialog and focus returns to the trigger — not treated as a gap here. Move to folder's focus drop is a separate gap → R700.

## Fix (Dashboard.tsx only)

- `const [actionNote, setActionNote] = useState('')` + `announce(text)` that sets it and clears it after 1.8 s (same self-clear pattern as `downloaded`).
- One more always-mounted `<p role="status" className="sr-only">{actionNote}</p>` next to the download status region (separate region so a download in flight is not overwritten).
- Duplicate copy: `const next = duplicateResumeVersion(v.id); if (applyVersions(next) && next) { announce(`Duplicated as “${next[0].name}”.`); focusAfterRender(`copy-${next[0].id}-open`) }` — the existing `focusAfterRender` (R645) + existing `copy-<id>-open` id; the browser scrolls the new row into view on focus.
- Duplicate document: same with `duplicateCareerDoc` and `doc-<id>-open`.
- No change to the duplicate naming, list order, storage or visible layout.

## Validation

`npx tsc -b --noEmit`, `npm run lint`, `git diff --check`, `npm run build`, `npm run verify-dist`; `npx wrangler deploy`; `qa/r699-verify.cjs 1280|375`: one `status` mutation with the new name, focus ends on `#copy-<newId>-open` / `#doc-<newId>-open`, new row in view, region empties, storage back to baseline, 0 console errors.

## Not verified

Real screen-reader listening; list view (`view === 'list'`) uses the same row helper — inferred; bulk mode unaffected (Duplicate is not a bulk action).
