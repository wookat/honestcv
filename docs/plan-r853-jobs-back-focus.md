# R853 — closing the single-pane `/jobs` detail hands keyboard focus back to the job row

## First-hand evidence (production R852 bundles `index-BdlN-B1L.js` / `Jobs-umTGJYkJ.js`, fresh no-cache contexts; `/home/ubuntu/qa/r853-evidence.cjs`)

Open a row from the single-pane list (≤ 1023 px), close the detail, then read `document.activeElement` and where the next Tab goes:

| viewport | close path | after close | next Tab lands on | page Y |
|---|---|---|---|---|
| 375×812 | pointer / Enter / Space on `Back to list` | `BODY` | sidebar `Upgrade` link (top 418) | 567 → **964** |
| 375×812 | browser Back (R531 history sentinel) | `BODY` | `Upgrade` | 567 → 964 |
| 768×800 | all four | `BODY` | sidebar `Resume builder` link | 377 → **678** |
| 1280×800 (split pane) | n/a — the pane never unmounts | selected row stays focused | row's `Save` | 233 unchanged |

- While the pane is open the tab order is sound (row → `Back to list` → `Tailoring report`); the defect is the Back button unmounting with the pane, so the browser's focus fixup drops focus to `<body>` and the next Tab starts from the document top, past the whole list — undoing R850's list-scroll restore.
- The row the pane was showing is visible again in the same commit (`button#job-card-<id>`, R850 restores its list offset), so it is the natural focus target. Console errors: 0.

## Decision (smallest change: the existing R850 close branch in `src/pages/Jobs.tsx`)

- The single-pane close effect already runs on `mobileDetail` false after the pane was open; after `window.scrollTo(0, listScrollRef.current)` it now focuses `job-card-<selectedId>` with `preventScroll` (the scroll offset is restored separately).
- `selectedId` is read through a ref synced in its own effect (declared first, so it runs earlier in the same commit) — the close effect still keys off `mobileDetail` alone, so a selection change while the pane is open does not re-run the scroll bookkeeping. Writing the ref during render is what `react-hooks` flags (lint error), hence the effect.
- Focus is only rescued when it is lost: `activeElement` is `null` / `<body>` **or still inside the hidden pane** (`detailPaneRef.current.contains(active)`). The second clause matters: during the commit that hides the pane the Back button is still `activeElement` — the browser only drops focus from a now-hidden control afterwards — so a body-only check fixes browser Back but not the button (measured on the first deploy `index-tBfk79We.js`: history → row, pointer / Enter / Space → still `BODY`). Focus taken by a dialog or an Undo toast is left alone.
- Desktop split pane (`SINGLE_PANE_MQ` false) returns early as before; missing row (job vanished) is a no-op.
- Rejected: `useFocusAfterRender` (it exists for targets rendered *by* the next render; here the row is already in the DOM and the shared hook has no "inside the closing pane" notion); focusing the list heading (loses the user's place); keeping Back mounted (changes the pane layout).

## Validation

- `tests/jobs-panes.test.ts` (+3, 431 total; the R853 block fails on the R852 tree): focus target + `preventScroll`, lost-focus guard incl. the hidden-pane clause, ref synced in its own effect ahead of the close effect. Note: the R818 structural test slices the source before the first literal `Back to list`, so comments must not contain that phrase.
- Gates: `npx vitest run` (431), `npx tsc -b`, `npm run lint` (0 errors, 11 pre-existing warnings), `npm run build`, `node scripts/verify-dist.mjs` (123).
- Deploy `0a559db2` (first cut, body-only guard) → `7406d3e6`; production `index-BvvI9LBO.js` / `Jobs-D-590HBO.js` SHA-256 = dist; health 200.
- Native re-measure on the loaded bundles: 375×812 / 768×800 / 375×500 — pointer, Enter, Space and browser Back all leave `job-card-1749306` focused with page Y exactly restored (567 / 377 / 614) and the next Tab on that row's `Save`; 1280×800 split pane unchanged (row focused, Tab → Save → status select); console 0.
