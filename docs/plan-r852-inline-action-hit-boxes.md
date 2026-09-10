# R852 — inline relationship actions / links keep a 32 px (< sm) hit area that never covers a neighbouring control

## First-hand evidence (production R851 bundles `index-DitFJpAm.js` / `Jobs-4AxVDqHY.js` / `Dashboard-…` / `Builder-…`, fresh no-cache contexts, 375; `/home/ubuntu/qa/r852-{evidence,linktext,probe,broaden}.cjs`)

The R651/R653 shared classes drew a 40 px hit box over a 16 px text line (`relative`, negative vertical margin 12 px, vertical padding 12 px) without moving layout. Because the box is `relative`, it paints above every later non-positioned sibling. Every production use measured at 375:

| route / state | pair | geometry | who receives the tap |
|---|---|---|---|
| `/jobs` detail pane | Tailoring report vs first Skills chip | report 254–294, chips from 292 (R851 made chips 32 tall, growing downward) | 2 px of the chip's top go to the report; a trusted touch at chip `top+1` opens the report |
| `/dashboard`, `/documents` copy / document notes (`CopyTargetNote`, Dashboard rows) | wrapped explanatory link (`INLINE_LINK`, 157 × 55) + inline `— use this one` action (69 × 40) | 23 px shared | the action's invisible padding paints over the link's **second text line**: middle / bottom samples at 25 / 50 % of that line hit the button |
| `/jobs?tab=tracked` panel | `Open …` / `Use this one instead` / `Use for this job` in one sentence | 40 px boxes side by side on one line | no cross-ownership (same line, no vertical neighbour) |
| `/builder` Target job | `Use this copy instead` + `View it on the jobs board →` | 40 / 39 px on one line | none |
| `/jobs` broader-query pill (`“nurse” · 7 titles match · 31 jobs`) | borrowed `INLINE_ACTION` for its 40 px height | standalone row | none — but it would shrink with the shared class |

- The product's row gap under these sentences is 10 px (report text bottom 282 → chips 292); a 12 px extension therefore always reaches the next row. 8 px fits.
- Same-line pairs (link + action in one sentence) are not a height problem: the later sibling's padding paints over the earlier one's words regardless of the height, so it needs a paint-order fix, not a size fix.

## Simulation in the live DOM (`/home/ubuntu/qa/r852-linktext.cjs`, `NO_LABEL=1` variant)

| variant | `/jobs` report ∩ first chip | dashboard / documents link second line (16 samples) | `/builder` | page width |
|---|---|---|---|---|
| R851 (40 px, no label layer) | 2 px, report wins at `top+1` | 8 / 16 lost to `use this one` | all self | 360 |
| 32 px, no label layer | 0 px, chip wins at `top+1` | 8 / 16 lost (`z-[1]` stripped from the deployed DOM) | all self | 360 |
| **32 px + `INLINE_LABEL` (`relative z-[1]`) on every visible label** | 0 px | **0 / 16 lost** | all self | 360 |

Row heights, line boxes and page width are identical in all three (padding sits on inline / negative-margin boxes).

## Decision (smallest change: `src/lib/utils.ts` + wrapping the labels where the classes are used)

- `INLINE_ACTION` / `INLINE_LINK`: vertical extension 12 → 8 px below `sm` (32 px box, the `< sm` size R657 / R851 chips use; ≥ 24 px per WCAG 2.5.8); desktop still resets to plain inline text.
- New `INLINE_LABEL` wraps the visible text of every `INLINE_ACTION` / `INLINE_LINK` (`CopyTargetNote`, `Dashboard`, `Jobs`, `Builder`): the words are always painted above a neighbour's invisible padding, so hit-testing on the words goes to their own control.
- The Jobs broader-query pill gets its own sizing (32 / 24 px min-height + border) instead of borrowing `INLINE_ACTION`.
- Rejected: keeping 40 px and fixing only Jobs (the 10 px row gap makes 12 px a general hazard, not a Jobs one); a component-scoped flow restructure of the sentences (changes layout on every route for a paint-order problem); raising the chips instead of the labels (per-neighbour magic).

## Validation

- `tests/inline-actions.test.ts` (+5, all fail on the R851 tree): class strings, `INLINE_LABEL`, broader-pill sizing / no negative margin, source scan that every `INLINE_ACTION` / `INLINE_LINK` element's first child is an `INLINE_LABEL` span.
- Gates: `npx vitest run` (428), `npx tsc -b`, `npm run lint` (0 errors, 11 pre-existing warnings), `npm run build`, `node scripts/verify-dist.mjs` (123).
- Deploy `ba8a7fd0`; read the loaded bundle names first; native re-measure at 375 / 1280 (`r852-verify.cjs`: report 258–290 vs chip 292, CDP touch `top+1` toggles the chip, `bottom−1` opens the report; linktext sweep 0 lost on all four routes); independent QA at 375 / 768 / 1280.
