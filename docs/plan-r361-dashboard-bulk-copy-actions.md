# R361 — Bulk actions on saved copies (dashboard)

## Firsthand evidence
- R358 SOP-10 production audit (index-BQNfD2pg.js): with 12 saved copies, every organizational action is one-copy-at-a-time — moving 5 copies into a folder takes 5 dialog round-trips; deleting several takes N confirm dialogs. Banked observation: "副本列表无 bulk 操作/搜索框". R360 shipped search; bulk was an explicit non-goal there.
- Rezi first-party copy (rezi.ai/job-search): "Utility-first bulk actions — Do more, faster. Manage your application tracking in bulk." We already matched that for the jobs pipeline in R249 (`bulkMode` + "Select…"/"Done selecting" + bulk status move / untrack). The dashboard copy list is the same shape of problem.

## Design (mirrors the R249 jobs convention)
Dashboard.tsx + a small resume.ts addition:
- `bulkMode` toggle button "Select…"/"Done selecting" (aria-pressed) in the saved-copy controls row, rendered when ≥2 copies exist. Toggling off clears the selection.
- In bulk mode each copy card/list row gets a leading checkbox (`aria-label="Select <name>"`); per-copy action buttons stay usable.
- When ≥1 selected, a toolbar (role=group "Bulk actions on saved copies") shows: "N selected", "Select all" (all currently visible copies — i.e. after folder chip + search filtering), "Move to folder…", destructive "Delete N…", and "Clear".
- Bulk move reuses the existing move dialog (`moving` state becomes `ResumeVersion | { bulk: true }`); choosing a folder / new folder / "Remove from folder" applies to every selected id via `updateResumeVersion` (organizational — timestamps unchanged).
- Bulk delete opens a confirm dialog ("Delete N copies?"), then removes them with new `deleteResumeVersions(ids)` and arms the existing undo bar with a new `{ kind: 'copies', entries: [{version, index}…] }` variant; Undo restores all at their original indices (ascending order via `restoreResumeVersion`).
- Selection is transient (not persisted); ids pruned from selection if the copies disappear.

## Non-goals
- No bulk duplicate/download/export.
- No bulk actions for career documents or samples.
- No persistence of bulk mode or selection.

## Validation
- Oracle for delete/restore index fidelity; tsc/eslint/build.
- Production QA: select via checkboxes across folder groups + search filter, select-all respects current filter, bulk move (existing folder / new folder / remove-from-folder), bulk delete + single Undo restores exact order, per-copy actions still work in bulk mode, toggle off clears, 375px strict light/dark, keyboard reachability, zero AI/shares/payments, clean baseline restore.
