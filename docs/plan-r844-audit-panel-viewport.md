# R844 — entry-audit findings panel stays inside the viewport from `sm` up

## Evidence (production R843 bundle `fc4280da`, first-hand)

- Origin: the R843 independent QA supplement
  (`/home/ubuntu/qa/r843-qa/supplement/1280-project-panel-left-clipping.png`): a Project card with a
  short title puts its green `✓` chip near the card's left edge; the desktop findings panel is
  right-aligned to the chip (`sm:absolute sm:right-0 sm:w-64`) and opened at **x = −53.7 px**, the
  findings text clipped off the viewport. Positioning unchanged since R691 / R817.
- `/home/ubuntu/qa/r844-evidence.cjs` (`/builder?example=software-engineer`, Experience / Education
  expanded, chip + panel rects per width; `document.documentElement.clientWidth` 1265 / 1009 / 753 with
  the native scrollbar at 1280 / 1024 / 768):

  | width | chip (natural titles) | panel | fits |
  |---|---|---|---|
  | 1280 | Role 1 358.6–388.4, Role 2 317.0–346.8, Edu 456.3–484.0 | 132.4–388.4 / 90.8–346.8 / 228.0–484.0 (w 256) | yes |
  | 1280, one-letter titles | Role 1 right 177.8, Role 2 180.2, Edu 208.0 | **−78.2**–177.8 / **−75.8**–180.2 / **−48.0**–208.0 | no |
  | 1024, one-letter titles | Role 2 right 180.2 | **−75.8**–180.2 | no |
  | 768, one-letter titles | Edu right 208.0 | **−48.0**–208.0 | no |

  The panel is a fixed 256 px box whose right edge follows the chip; the chip follows the title text, so
  any card whose title is shorter than ~250 px of text (short names, the green `✓` state, any card at
  768 where the header is narrower) lands the panel's left edge outside the viewport. Page
  `scrollWidth === clientWidth` throughout — negative-left overflow creates no scrollbar, so the defect
  is invisible to overflow checks and must be asserted on `panel.getBoundingClientRect().left`.
- Below `sm` the panel is a fixed strip (`fixed inset-x-4 bottom-20 z-40`, x 16–359 at 375, R817) and
  is not affected.
- Harness note: on a fresh profile `?example=` opens the "Load this example?" dialog, which intercepts
  pointer events; the scripts click its `Replace with example` button and wait before measuring
  (`r844-dialog.cjs` records the dialog text).

## Options simulated (`/home/ubuntu/qa/r844-simulate.cjs`, DOM surgery on production, no source change)

Applied `transform: translateX(shift)` to the live panel with `shift = popoverShift({ left: right − 256,
right }, clientWidth)` (the R827 month-year picker utility, 8 px margin), one-letter titles:

| width | chip right | before | shift | after | width | page scrollWidth |
|---|---|---|---|---|---|---|
| 1280 | 177.75 | −78.25 … 177.75 | +86.25 | 8 … 264 | 256 | 1265 = 1265 |
| 1280 | 180.17 | −75.83 … 180.17 | +83.83 | 8 … 264 | 256 | 1265 = 1265 |
| 1280 | 207.98 | −48.02 … 207.98 | +56.02 | 8 … 264 | 256 | 1265 = 1265 |

Text starts at x ≈ 17 (panel padding), the panel keeps its width, the page gains no horizontal overflow.

1. Keep — every short-titled card's findings are unreadable on desktop. Rejected.
2. Left-align the panel to the chip from `sm` up — moves every currently fitting panel and only inverts the
   failure mode: a chip within 256 px of the right margin would clip on the right instead (none of the
   measured chips does — Education at 768 would end at x ≈ 740 of 753 — but the rule does not fail
   closed). Rejected.
3. Anchor the panel to the card instead of the chip — changes the DOM that R817 / R843 tests and the
   reducer's `wrapRef` outside-click test rely on. Rejected as out of proportion.
4. **Adopted**: keep the right-aligned layout and correct it only when it would cross a viewport margin,
   exactly as `MonthYearField` does (R827): measure the untransformed rect from the anchor's right edge
   and `panel.offsetWidth`, `popoverShift(rect, document.documentElement.clientWidth)` (8 px margin, 0
   when it already fits), apply as `transform: translateX(shift)`. Fitting panels are pixel-identical;
   only clipped ones move.

## Fix (`src/components/EntryAuditChip.tsx`)

```tsx
const panelRef = useRef<HTMLDivElement>(null)
const [shift, setShift] = useState(0)
useLayoutEffect(() => {
  if (!visible) return
  const place = () => {
    const panel = panelRef.current, anchor = wrapRef.current
    if (!panel || !anchor) return
    if (getComputedStyle(panel).position !== 'absolute') { setShift(0); return } // fixed strip < sm
    const right = anchor.getBoundingClientRect().right
    setShift(popoverShift({ left: right - panel.offsetWidth, right }, document.documentElement.clientWidth))
  }
  place()
  window.addEventListener('resize', place)
  return () => window.removeEventListener('resize', place)
}, [visible])
…
<div id={panelId} ref={panelRef} style={shift ? { transform: `translateX(${shift}px)` } : undefined} …>
```

- Measures from the anchor and the intrinsic width, never from an already transformed rect, so
  re-runs (resize) do not compound.
- Runs only while the panel is visible (`useLayoutEffect`, before paint — no flash at the clipped
  position); re-runs on `resize`; resets to 0 below `sm` where the panel is `position: fixed`.
- Reducer, events (hover / pin / Escape / outside / blur / expandable pointer-down), accessible name,
  `aria-expanded` / `aria-controls`, panel classes and content, badge and the R843 24 / 40 px targets
  untouched. Server-rendered (hidden) markup carries no transform.

## Tests

- `tests/entry-audit-chip.test.ts` — new `describe('R844 …')`: (a) the measured production
  geometries through `popoverShift` (three clipped cases → +86.25 / +83.83 / +56.02 to x = 8; two
  fitting cases → 0); (b) source-level integration — `popoverShift` import, the `visible`-gated
  `useLayoutEffect`, the `position !== 'absolute'` reset, the anchor-right / `offsetWidth` /
  `clientWidth` call, the `resize` listener, the `translateX` style; panel classes still
  `fixed inset-x-4 bottom-20 z-40 … sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-1 sm:w-64`;
  static markup has no `translateX`. (b) fails on the R843 tree (1 failed | 5 passed), passes with the fix.
- `tests/month-year-popover.test.ts` already covers `popoverShift` left / right / fitting / margin.
- Gates: vitest **401** (399 + 2), `tsc -b` (no `tsconfig.base.json` in the repo — `-b` used as the
  project build), eslint 0 errors / 11 pre-existing warnings, `npm run build`, `verify-dist` 123.
- Built CSS differs from production R843 by one inert rule, `.min-w-6{min-width:…}` — Tailwind v4
  scans `docs/plan-r843-audit-chip-target-size.md`, which mentions the bare class; no element uses it.

## Deploy

- New Cloudflare account creds (`CLOUDFLARE_API_KEY=$CLOUDFLARE_NEW_GLOBAL_API_KEY`,
  `CLOUDFLARE_EMAIL=$CLOUDFLARE_NEW_ACCOUNT_EMAIL`), version `8badc26e`; production
  `index-CTkrclkI.js` `c95cdac1…` / `Builder-C1Njubxc.js` `bb2c2f06…` / `style-BblEwaNN.css`
  `da51f0dc…` SHA-identical to `dist/client/assets`; static pages, `/examples/examples.json`,
  `/api/health` 200; the Builder chunk contains the compiled effect; R843 / R842 rules still present.
- Native re-run of `r844-evidence.cjs` (no DOM surgery): one-letter-title panels **[8, 264]** at
  1280 / 1024 / 768 (clientWidth 1265 / 1009 / 753); natural-title panels byte-identical to R843
  (132.4–388.4 / 90.8–346.8 / 228–484 at 1280); 375 strip 16–344 unchanged; console 0.

## Production QA (independent testing agent)

- Five fresh cache-disabled contexts (1280 / 1024 / 768 / 375) plus a flag-configured genuine-hover
  Chrome; trusted pointer / keyboard / touch; axe WCAG 2.2; recordings
  `/home/ubuntu/qa/r844-qa/r844-{1280,1024,768,375}-readable.mp4`; raw
  `/home/ubuntu/qa/r844-qa/{all,verification-summary}.json`; storage / cookies / IndexedDB restored
  byte for byte. **Passed — 398 assertions, no product defect.**
- Containment: 80 cases (Role 1 / Role 2 / Education 1 / Project 1 × natural / short / long warning,
  short / long green × 4 widths) all inside the 8 px margin; formerly clipped short-title panels at
  **8–264** (256 wide) with the findings text fully visible
  (`r844-qa/1280-short-green-Project-1.png`, `1024-short-green-Project-1.png`,
  `768-short-warning-Project-1.png`); the 31 naturally fitting desktop panels carry no transform and
  equal the full right-aligned rectangle; `scrollWidth === clientWidth` in every case.
- Resize with the panel open 1280→768→1280→768→375→639→640→768→1280: contained throughout, transform
  cleared below `sm`, no compounding on return.
- Behaviour as R843: hover / focus open, click pins, second click hides, Escape / blur / outside
  close, `aria-expanded` tracks, collapsed Role / Education / Project expand on trusted pointer-down
  and Enter at all widths; genuine trusted hover on an unfocused chip opens the panel
  (`r844-qa/hover/1280-genuine-hover-short-project.png`). Chips 27.7–29.9 × 24 / 24 × 24 desktop,
  40 × 40 mobile. 375: two-tap open / close, strip x 16–344 ending at y 732 (19 px above the pane
  switcher), last row passes `elementFromPoint`, no transform.
- Full-Builder axe (WCAG 2.2 tags) with a panel open: 0 violations at 1280 and 375, top and
  Role-visible positions. Assets = dist SHA before / after every context; 365 GET / 0 non-GET /
  0 AI / 0 checkout / 0 console or page errors / 0 failed requests.
- Harness corrections recorded in the raw log: the example dialog is conditional (an empty profile
  loads the sample directly); one touch-probe typo fixed before execution.
- Not covered: physical devices, real screen readers.

## Not changed / honest limits

- Sticky section-nav occlusion of the panel (a scroll-position artefact, R843 finding 2) is out of
  scope; the correction is horizontal only, as the evidence is.
- `resumeStrength` vs `resumeHealth` wording, LinkedIn non-English export: no fresh evidence, untouched.
- R843 target sizes untouched.
