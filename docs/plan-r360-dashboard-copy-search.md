# R360 — Search saved copies on the dashboard

## Firsthand evidence
- R358 SOP-10 production audit (2026-08-31, index-CMcyuhvX.js): with 12 saved copies the
  dashboard offers sort (edited/created/name), grid/list view, and folder chips — but no way to
  find a copy by name other than scrolling. The audit banked this as an observation:
  "副本列表无 bulk 操作/搜索框".
- Rezi's dashboard (firsthand screenshots from earlier SOP-10 rounds) has a persistent search
  field over the resume list; power users are expected to keep one copy per application
  (our own header copy says the same), so lists grow fast.
- Rezi changelog re-checked this round (https://www.rezi.ai/rezi-changelog): still nothing newer
  than the August 2026 / Week 4 entries.

## Gap
Finding one copy among many requires scanning the whole grid. Folders help only if the user
curated them; name sort still requires visual scanning.

## Fix (minimal)
Client-side name filter in `Dashboard`:
- `searchQuery` state; case-insensitive trimmed `includes` match against `v.name` and `v.folder`
  inside the existing `sortedVersions` memo (before sort), so folder groups, the ungrouped grid,
  and list view all inherit it.
- Input (with Search icon, clear button when non-empty) rendered in the existing controls row,
  shown under the same `versions.length > 0` guard as sort/view controls.
- While a query is active the Current-draft card is filtered by its display label too, and a
  "No copies match …" empty-state line renders when nothing matches.
- Folder chip counts stay based on the unfiltered list (they are navigation, not results).

## Non-goals
- No bulk operations (separate banked observation, separate round).
- No persistence of the query (transient UI state, unlike view/sort which persist by design).
- No change to career-documents or samples sections.

## Validation
- tsc / eslint / build locally.
- Production QA: seed ~8 copies across 2 folders; search narrows grid+groups live, clear
  restores, no-match state, list view, folder chips unaffected, draft-card filtering,
  375px strict + dark mode, keyboard reachability, zero AI/shares/payments, baseline restore.
