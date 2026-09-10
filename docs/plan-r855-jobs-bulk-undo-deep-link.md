# R855 — bulk-untrack Undo hands focus to a restored row; a cold `?job=` deep link lands where a tap does

Three candidates were carried over from R854. Each was measured on production first
(fresh cache-disabled contexts, loaded bundle names read on the navigation being measured).

## 1. Ordinary Undo shifts page Y by +98 / +44 px — measured, **not a defect**

All-jobs case (row stays in the feed, pane stays open), untrack then Undo, R854 bundle:

| width | scrollY after Undo | rows | `Hide:` group height | focused target | target viewport top |
| --- | --- | --- | --- | --- | --- |
| 375×812 | 756 (+98) | 150 | 86 px | `#track-chip-saved`, visible | 402 |
| 1280×800 | 277 (+44) | 150 | 32 px | `#track-chip-saved`, visible | 361 |

What is inserted above the grid is the **`Hide:` status-chip filter group**
(`tab === 'all' && pipeline.length > 0`, `mt-3` = 12 px): 86 + 12 = 98 and 32 + 12 = 44
exactly. Untracking the only tracked job empties the pipeline, the group unmounts and the
grid moves up; Undo restores the pipeline, the group remounts and the grid moves down.
The browser's scroll anchoring keeps the focused chip at the same viewport position, so the
user sees nothing move. The group exists only when there is something to hide (its own
contract), so no change.

## 2. Bulk untrack Undo on the Tracked tab — **confirmed defect, fixed**

Fixture: save two jobs via the pane's `#track-chip-saved`, open `/jobs?tab=tracked&q=<no match>`
(pipeline is the rows' only source), Select… → tick both → Untrack 2 → confirm → Undo.
Before the fix the restored rows came back but focus fell to `<body>` — the bulk handler
matched `undoUntrack` against `selected?.id` only, and with no pane open nothing was queued.
R854 fixed the single-item handler; the bulk handler had the same hole with no fallback.

Fix (`src/pages/Jobs.tsx`, bulk Undo handler): when no restored entry matches
`selectedId ?? selected?.id`, queue `job-card-<first restored id>` then `main`.
The fallback never focuses another job's status chip (the open pane, if any, is unrelated
to the restored rows). Single-item Undo (R854) and Dismiss (R650, neighbour row) unchanged.

Deploy `7a350c07` (`index-CVdpIszG.js` / `Jobs-aUhYuUbT.js`). Native re-measure 375×812 and
1280×800: after bulk Undo focus `button#job-card-<restored>`, Tab → that row's `Saved`, Tab →
its status `<select>`; bulk Dismiss → remaining neighbour row at both widths; console 0.

## 3. Cold `?job=` deep link at 768 — **confirmed, fixed**

R850 recorded the limit: the cold link at 768×800 settled with the pane top at 357 while a
tap puts it at 63. Sampled every 50 ms from first paint (R854 bundle):

| moment | scrollY | docH | pane document Y | pane viewport top |
| --- | --- | --- | --- | --- |
| mount (0 rows) | 172 | 972 | 235 | — |
| fetch settled (150 rows) | 172 | 1478 | 529 | **357** |
| tap path, settled | 466 | 1478 | 529 | 63 |

The R850 reveal runs on mount, when the page is 972 px tall and the pane sits at 235 — the
furthest it can scroll is 172. The first fetch then renders the status / location filter rows
above the pane (+294 px) and nothing re-reveals it. 375×812 happened to settle at 63 both
ways, so R850's 375 QA did not see it.

Fix (`src/pages/Jobs.tsx`): `revealAfterFetch = useRef(seedParams.get('job') !== null)`;
an effect on `[loading]` that, once `loading` is false and the flag is armed, consumes the
flag and — on a single pane only — calls the same `detailPaneRef.current.scrollIntoView({ block: 'start' })`
a tap uses. Armed only by the deep link and consumed after one use, so a later search typed
above an open pane never scrolls the page. Rejected: re-running the R850 open effect on
`selected` (would overwrite the stored list Y), scrolling to the title (pushes Back out).

Tests `tests/jobs-panes.test.ts` +2 (437). Gates green: vitest 437, `tsc -b`, eslint 0 errors /
11 pre-existing warnings, build, verify-dist 123.

Deploy `6c075e5b`; production `index-BM1raY7x.js` / `Jobs-CtZAIQE0.js` (both `/jobs` and
`/jobs?job=` HTML). Native re-measure on the loaded bundles (`qa/r855-coldlink3.cjs`):

| width | mount | settled |
| --- | --- | --- |
| 768×800 | scrollY 172, docH 972, 0 rows | scrollY 466, docH 1478, **pane top 63**, Back 80, 150 rows |
| 375×812 | — (settled before first sample) | scrollY 658, docH 2056, pane top 63, Back 80 |

Tap path at 768 still 63 (R850). Control (`qa/r855-search-open.cjs`, 768): deep-linked pane
open, scroll to 120, type a new search + Enter → 44 rows, pane still open, **scrollY 120**
(the re-reveal did not fire again). Console 0 on every run.

## Harness lesson

Read the loaded bundle names on the *navigation you measure*: the edge served the old HTML
for `/jobs` and the new HTML for `/jobs?job=` for a few minutes after the deploy, so a probe
that logs bundles from the first navigation reports the wrong build for the second.
