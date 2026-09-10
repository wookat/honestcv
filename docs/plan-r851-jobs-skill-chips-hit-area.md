# R851 — `/jobs` skill chips get a 32 px (< sm) / 24 px (sm+) hit area

## First-hand evidence (production R850 bundle `index-Dutu_pvd.js` / `Jobs-CmOhXU9F.js`, fresh no-cache contexts, real pointer click on row 13 "Freelance Copywriter", `/home/ubuntu/qa/r851-evidence.cjs`)

Every interactive control inside the open detail pane, 375 and 1280 (identical chip geometry at both):

| control | 375 | 1280 | neighbour gap |
|---|---|---|---|
| Back to list | 92 × 40 | hidden (lg) | — |
| Tailoring report | 88 × 40 (`-my-3 py-3`) | 88 × 16 (`sm:py-0`, R653 desktop shape) | 0 / 10 |
| **10 skill chips** (`Filter jobs by "…"`) | **46–96 × 20** | **46–96 × 20** | 6 px (`gap-1.5`); first chip touches Tailoring report at 375 |
| Target my resume / Cover letter / Apply on site | 40 tall | 32 tall | 6 |
| Saved / Applied / Interviewing / Offer / Rejected | 40 tall (`min-h-10`) | 32 tall (`sm:min-h-8`) | 6 |

- The skill chips are the only controls in the pane under 24 px, at every width: `rounded-full px-2 py-0.5 text-xs` with no minimum height gives 16 px line + 4 px padding. Row pitch 26 px.
- Same class string on the list header's "Repeated skills" row (`Find more jobs asking for "…"` / `Remove "…" from the skills filter`) — same 20 px at every width. The `+N more` expander in the Skills row is a 16 px text link.
- This is the `target-size` violation axe reported on the R850 375 open-detail scan (`go` 30.6 × 20 px, "insufficient space"); the pane had never been scanned open before R850. The other R850 finding (`Germany (7)`) is sticky-header `partiallyObscured` at that scroll position — location chips are 40 / 32 tall — not a node-size defect.
- Product conventions: Builder keyword chips 32 px below sm (R657); entry-audit chip 24 px from sm up (R843); every other `/jobs` chip 40 / 32.

## Simulation in the live DOM (`/home/ubuntu/qa/r851-simulate.cjs`, `min-height: 2rem` below 640, `1.5rem` from 640)

| viewport | chip height | Skills row height | row pitch | pane scrollHeight | pane outer height | document width | text offset in chip |
|---|---|---|---|---|---|---|---|
| 375 | 20 → 32 | 98 → 146 (4 rows, +12 each) | 26 → 38 | 3078 → 3126 | 630 → 630 | 360 / 360 | −0.5 → −0.5 |
| 768 | 20 → 24 | 72 → 84 | 26 → 30 | 2464 → 2476 | 630 | 753 / 753 | unchanged |
| 1280 | 20 → 24 | 46 → 54 | 26 → 30 | 2310 → 2318 | 630 | 1265 / 1265 | unchanged |

- Chip widths unchanged; the button centres its text so the label stays where it was; the pane's outer box (`max-h-[70vh]`, inner scroll) does not move anything below it; no horizontal overflow.
- 40 px at < sm (the pane's status-chip convention) was considered and not taken: it would add 20 px per row (+80 px at 375 for a 10-chip row) to a row that is a secondary, densely-wrapped set of filter toggles; 32 px is the size the Builder's equivalent chips already use (R657) and keeps the 24 px spacing rule with margin (32 + 6 pitch).

## Decision (smallest change, `src/pages/Jobs.tsx` only)

- Add `min-h-8 … sm:min-h-6` to both states of both skill-chip class strings (detail-pane Skills row, list-header Repeated skills row) and to the `+N more` expander. Padding, gaps, colours, `aria-pressed`, titles, wrapping and the R850 open/close scroll behaviour are untouched.
- Rejected: leaving it (real 2.5.8 gap at every width, the only sub-24 px controls in the pane); 40 px (see above); changing `gap-1.5` (the spacing rule is already met once the chip is ≥ 24).

## Validation

- `tests/jobs-panes.test.ts` +2 (both fail on the R850 tree): all four chip class strings carry `min-h-8` and `sm:min-h-6`; the `+N more` expander too.
- Gates: `npx vitest run` (423), `npx tsc -b`, `npm run lint` (0 errors, 11 pre-existing warnings), `npm run build`, `node scripts/verify-dist.mjs` (123).
- Deploy with the new-account Cloudflare credentials; read the loaded bundle names before measuring; independent QA at 375 / 768 / 1280 with the detail open: chip boxes, row pitch, axe at the open-detail scroll position, R850 reveal / Back restoration, Repeated-skills row with a query that populates it, storage restored byte for byte.
