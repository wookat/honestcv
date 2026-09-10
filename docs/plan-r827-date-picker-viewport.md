# R827 — the month-year picker popover stays inside the viewport (375 px start-date fields)

## Evidence (first-hand)

- Found by the R826 production QA at 375×667: the *start* date's picker is clipped off the
  left edge of the screen — the previous-year button and the Jan / Apr / Jul / Oct column are
  not reachable. The end date's picker fits. `document.scrollWidth` stayed 375, so none of the
  earlier overflow probes (R199, R588…, R818) ever saw it: an absolutely positioned box with a
  negative `left` creates no scrollbar.
- Focused measurement on production before any change (`/home/ubuntu/qa/r827-evidence.cjs`:
  open every `Open date picker` button in the all-sections fixture, read the popover rect and
  every control rect against `[0, innerWidth]`, Escape, next):

  | viewport | pickers | popover rect (start / end)  | outside viewport                          |
  | -------- | ------- | --------------------------- | ----------------------------------------- |
  | **375**  | 10      | **−48…176** / 90…314        | **5** (every start field): `Previous year` −35…−3, `Jan/Apr/Jul/Oct` −39…27, `<year> only` −39…62 |
  | 1024     | 10      | 26…250 / 239…463            | 0                                         |
  | 1280     | 10      | 228…452 / 367…591           | 0                                         |

  (The R826 QA harness measured the same start popover at −40.5…183.5 — that browser had no
  15 px native scrollbar; same defect, different geometry.)
- Cause (source, `src/components/MonthYearField.tsx`): the popover is
  `absolute right-0 top-full w-56` (224 px) inside the field's `relative` wrapper. Below `sm`
  the start and end fields share one row (R798), so the start field is 130–137 px wide with
  its right edge at x≈176; a 224 px box right-aligned to it starts at −48. The same class on
  the audit-chip panel produced the same clipping in R149 (fixed there by docking the panel).

## Decision

Keep the popover right-anchored and 224 px wide; when it would cross the viewport, shift it
back with a transform, measured from the field's anchor so the untransformed rect is known
without reading the popover's own (already shifted) rect:

```ts
// src/lib/popoverShift.ts
export function popoverShift(rect, viewportWidth, margin = 8): number {
  if (rect.left < margin) return margin - rect.left
  if (rect.right > viewportWidth - margin) return viewportWidth - margin - rect.right
  return 0
}
```

```tsx
// MonthYearField: on open (and on window resize while open)
const right = anchor.getBoundingClientRect().right
setShift(popoverShift({ left: right - pop.offsetWidth, right }, document.documentElement.clientWidth))
…
style={shift ? { transform: `translateX(${shift}px)` } : undefined}
```

- `useLayoutEffect`, so the shift is applied before the first paint of the open popover (no
  visible jump); `clientWidth` of the root excludes a classic scrollbar, so the 8 px margin is
  measured from the visible edge.
- Popovers that already fit get `shift = 0` and no inline style — 1024 / 1280 (and the 375
  end field) render byte-identically to R826.
- Right-edge overflow is handled symmetrically for free (a field near the right edge of a wide
  layout, e.g. a future third column).

Rejected, and why:

- `left-0` on start fields / `right-0` on end fields (a prop): needs every call site to know
  which side it sits on, and still clips whenever a single field is narrower than 224 px and
  hugs an edge (320 px, RTL, future layouts).
- Dock the picker to the bottom of the screen below `sm` like the audit panel (R149): a
  different interaction from the desktop popover for the same control, and it would cover the
  end field the user reads while picking a start.
- Shrink the popover to the field width: 3 month columns in ≤ 130 px are 9 px labels.
- Render through a portal with viewport positioning: more code and a new stacking context for
  a fix that a one-line translate covers; the popover already scrolls into view.

## Verification

- `tests/month-year-popover.test.ts` (3 tests): `popoverShift` on the production rects
  (375 start → +56, 375 end → 0, 1024 / 1280 → 0, right-edge overflow → negative shift);
  source-level: the field imports the helper, measures from the anchor in a
  `useLayoutEffect` gated on `open`, re-places on `resize`, applies the shift as a
  `translateX` and keeps the `absolute right-0 … w-56` popover. The source-level test fails on
  the R826 tree (the two pure tests pass there — they test the new module).
- Gates: `npx vitest run` 326 (323 + 3) · `tsc -p tsconfig.app.json` · `tsc -b` · `eslint .`
  0 errors / 11 pre-existing warnings · `npm run build` · `npm run verify-dist` 123 URLs.
- Local preview (`vite preview` :4179, `qa/r827-evidence.cjs`): 320 → start 8…232 / end
  35…259; 375 → start **8…232** / end 90…314; 1024 → 26…250 / 239…463; 1280 → 228…452 /
  367…591; 10/10 pickers inside at every width (0 outside-viewport controls).
- Deploy: `npm run deploy` (uploaded 30 assets; route listing still `code: 10000`);
  production `index-nYcB3v9R.js` / `Builder-BbLr9IND.js` SHA-256 identical to dist
  (`631fa0cd7a5ec3a1` / `a08fd201d30f35bf`), bundle contains `translateX(${p}px)`.
  `qa/r827-evidence.cjs` re-run on production: same rects as the local preview at 375 / 1024 /
  1280, 0 outside.
- Production QA (testing agent, independent, real Chrome, cache disabled, storage restored
  byte for byte; `/home/ubuntu/qa/r827-qa/`, recording `r827-375-readable.mp4`):
  **375×667 — every R827 oracle passes.** 12 pickers across the five dated sections (both
  experience cards), **192 controls all inside the viewport**; every start panel 8…232 with
  `translateX(48.5px)`, every end panel 105…329 with no transform (identical to the R826
  measurement of the same panel — that harness has no native scrollbar, so 90…314 in the
  evidence run and 105…329 there are the same geometry); every control visible, centre
  hit-testable, no ancestor clipping; document and visual width 375. Previous year → Jan saved
  `Jan 2022`, Next year → Dec saved `Dec 2023`, year-only `2023`, Present, Clear — input =
  stored JSON, panel closed; Escape after changing the year and outside pointerdown close
  without a byte changing; typed `Feb 2024` survives reload; a picker opened near the bottom
  scrolls into view (y 330…587 in 667). axe 0 violations with a picker open. Assets
  re-discovered independently and SHA-identical to dist. Harness note (not product): seven
  first-pass storage assertions used `start`/`end` instead of `startDate`/`endDate` — kept in
  `oracle-correction.json`, replayed with the real keys, passed.
  **Not run on production — outage:** the 1024×768 / 1280×800 control matrices, resize with
  a picker open, the empty-resume mobile matrix, axe at 1280. Between the 375 pass and the
  desktop pass `cv.zalize.com` began returning HTTP 530 / Cloudflare 1016 (every zalize.com
  Worker domain with it): the .com delegation for `zalize.com` changed at 2026-09-09 18:15Z
  from this account's zone (`chip`/`savanna.ns.cloudflare.com`, now status `moved`) to
  `hazel`/`viddy`, a zone that has no `cv.zalize.com` record. Outside the repo and this
  account's token; reported. Those widths are covered by the pre-outage production run of
  `qa/r827-evidence.cjs` (10/10 pickers inside at 1024 and 1280, rects unchanged from R826)
  and by the local preview; the independent desktop pass is owed once production is back.

## Boundaries

- The popover is still 224 px; below a 240 px layout width it would be shifted to x=8 and
  overflow the right edge instead (no product viewport that small — 320 is the WCAG floor).
- Vertical placement is unchanged (`top-full`, `scrollIntoView({ block: 'nearest' })`); a
  picker opened near the bottom of a short viewport scrolls the page, as before.
- Only `MonthYearField` uses `popoverShift`. The audit-chip panel keeps its R149 mobile dock;
  other `absolute right-0` popovers were not re-audited in this round.
