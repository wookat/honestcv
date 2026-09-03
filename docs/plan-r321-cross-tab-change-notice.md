# R321 — Builder notices when the resume changes in another tab

## Evidence (verified)

- Rezi is account-based and cloud-persisted: its editor state lives server-side
  (changelog 2026-08 Week 2 "Improved Resume Unlocking: 'Updated at' timestamp now
  correctly maintained when unlocking a resume" presumes server-tracked resume state;
  login is required for the editor). Two Rezi tabs therefore converge on the same
  server document — stale-tab clobbering is not a user-visible failure mode there.
- HonestCV is browser-local-first. Verified in source (current main):
  - `src/lib/resume.ts` — `saveResume` writes `honestcv.resume` via
    `localStorage.setItem(STORAGE_KEY, JSON.stringify(resume))`.
  - `src/pages/Builder.tsx` `useDebouncedSave` — every edit debounce-writes the
    tab's in-memory `resume` 400 ms later, plus a `pagehide`/`visibilitychange`
    flush of any pending edit.
  - `grep -r "'storage'" src/` → zero matches: **no code anywhere listens for
    cross-tab `storage` events.**
- Consequence (deterministic from the above, will be reproduced in production QA):
  open /builder in two tabs; edit in tab B; return to tab A (holding the older
  in-memory copy) and type one character → tab A's debounced save overwrites all
  of tab B's newer edits silently. Same hazard when the dashboard in another tab
  loads a different copy (`Set as active` / duplicate flows call `saveResume`).

## Gap

Silent last-writer-wins data loss across tabs, with zero warning. For a product
whose whole persistence story is the browser, this is a core-depth robustness gap
(boss priority: 实体操作台与核心功能深度 over copy tweaks).

## Design (narrow, additive)

Detection + explicit user choice only — no auto-merge, no auto-reload, no change
to save semantics:

- Builder keeps `lastKnownJson` ref = `JSON.stringify(resume)` (updated in an
  effect on every state change; byte-identical to what `saveResume` writes).
- One `window` `storage` listener (mounted once): fires only in *other* tabs by
  spec, never in the writing tab. On `key === 'honestcv.resume'` with a non-null
  `newValue !== lastKnownJson.current` → `setExternalUpdate(true)`.
- Status bar (same visual pattern as the R320 undo bar): fixed bottom-center,
  `role="status"`, text `This resume was changed in another tab.`, a **Load
  latest** button (`setResume(loadResume())`, dismisses the bar; the normal save
  effect then re-persists + records an undo snapshot, so the load itself is
  undoable via Builder history), and an X `aria-label="Dismiss"` (keep editing;
  this tab's next save wins — now an informed choice).
- Mobile: bar sits at `bottom-16` (above the fixed `bottom-0 z-30` edit/preview
  pane switcher), `lg:bottom-4` on desktop.

Out of scope: merging, per-field conflict resolution, warning on the
`visibilitychange` flush path, dashboard/versions cross-tab live refresh,
BroadcastChannel (storage event suffices and is universally supported).

## Validation

- Oracle: none needed beyond types — the change is one listener + one bar; logic
  is `newValue !== lastKnownJson` string compare. `npx tsc -b`, eslint on
  Builder.tsx, `npm run build`.
- Production QA (testing agent, CDP, zero AI): two-tab flow — edit in tab B, bar
  appears in tab A only; Load latest syncs tab A byte-identically to storage and
  bar closes; Dismiss keeps editing and tab A's save then wins (documented
  last-writer semantics); no bar on same-tab edits; no bar when another tab
  writes an identical value; 375px strict scrollWidth=375 with bar visible above
  the pane switcher; dark mode; baseline restore.
