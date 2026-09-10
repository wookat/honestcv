# R850 — tapping a job on a single-pane `/jobs` shows the job, not the search form

## First-hand evidence (production R849 bundle `index-CHFH6nYw.js` / `Jobs-DQhyPkip.js`, fresh no-cache contexts, real pointer click, `/home/ubuntu/qa/r850-evidence.cjs`)

| viewport | list Y before tap | page Y after tap | detail pane top | pane visible | "Back to list" top | title top |
|---|---:|---:|---:|---:|---:|---:|
| 375×812 | 642 | 0 | 721 | 91 px | 738 | 786 |
| 375×500 | 761 | 0 | 721 | **0 px** | 738 | 786 |
| 768×800 | 412 | 0 | 529 | 271 px | 546 | 594 |

- Immediate and settled geometry identical; cold `?job=<id>` deep link lands the same way; "Back to list" restores the list Y exactly (R532).
- What the user sees after tapping a row at 375×500: the "Job search" heading, intro and status chips — the row they tapped has vanished (the list is hidden) and nothing of the job is on screen. At 375×812 they see the search form, and the pane's first 91 px (the Back link and half the title) at the bottom edge.
- Cause: R532 (2026-08-31) opens the pane with `window.scrollTo(0, 0)` — when it shipped the pane started near the top. Since then the block above the two panes grew (categories R704, type / skills, location + chips R716–R718, sources intro R747), so at 375 the pane now starts 721 px down the page.
- Simulation in the live DOM: `pane.scrollIntoView({ block: 'start' })` → page Y 658 / 658 / 466, pane top **63** at every viewport (under the 57 px sticky header via the R658 `scroll-padding-top: 4rem`), Back link at 80, title at 128; page height allows it (max Y 1244 / 1338 / 678).

## Decision (smallest change, `src/pages/Jobs.tsx` only)

- Keep the R532 shape (remember the list Y, restore on close). Replace `window.scrollTo(0, 0)` with scrolling the detail pane's own top into view: a `detailPaneRef` on the pane container, `scrollIntoView({ block: 'start' })` — honours the shared `scroll-padding-top`, instant (`behavior: auto`) so reduced-motion is respected by default, falls back to `scrollTo(0, 0)` if the ref is missing.
- Rejected: `scrollTo(0, 0)` plus moving the filters below the pane (R818 layout change); a fixed overlay pane (new modal semantics, history sentinel R531 interplay); scrolling to the title inside the pane (drops the Back link above the fold).

## Validation

- Tests: source-level lock that the single-pane open effect targets the pane (not `scrollTo(0, 0)`) and still restores `listScrollRef` on close.
- Gates: vitest, `tsc -b`, eslint, build, verify-dist. Deploy, read the loaded bundle names, re-measure 375×812 / 375×500 / 768×800 / 1280 (desktop must not scroll on selection), then independent production QA.
