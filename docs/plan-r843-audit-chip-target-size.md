# R843 — entry-audit chip keeps a 24 px hit area from `sm` up (WCAG 2.5.8)

## Evidence (production R842 bundle `9cf9faf1`, first-hand)

- Origin: the R842 independent full-Builder axe run (WCAG 2.2 tags, 1280,
  `/home/ubuntu/qa/r842-qa/1280-axe.json`) reported one `target-size` violation (serious):
  `Role 1: 3 suggestions` and `Role 2: 3 suggestions` — "Target has insufficient size
  (29.9px by 17.3px, should be at least 24px by 24px)"; nearest neighbour `move-experience-0-down`,
  safe clickable diameter ≈ 22 px.
- `/home/ubuntu/qa/r843-evidence.cjs` (`/builder?example=software-engineer`, Experience / Education /
  Projects expanded, every `button[aria-controls][aria-label*="suggestion|best practice"]`):

  | width | Role 1 / Role 2 chip | Education 1 chip | title row `<p>` | nearest control gap | page |
  |---|---|---|---|---|---|
  | 1280 | 29.9 × 17.3 | 27.7 × 17.3 | 342.4 / 300.8 × 22 | 2.3 px (Move up / down below) | 1280 = 1280 |
  | 1024 | 29.9 × 17.3 | 27.7 × 17.3 | 342.4 / 300.8 × 22 | 2.3 px (Hide / Delete below) | 1024 = 1024 |
  | 768 | 29.9 × 17.3 | 27.7 × 17.3 | 342.4 / 300.8 × 22 | 30 px (role / company inputs) | 768 = 768 |
  | 375 | 40 × 40 | 40 × 40 | 268 × 40 | 0 (toolbar buttons touch, all 40 px) | 375 = 375 |

  The chip button's only size is its coloured badge (`px-1.5 py-0.5 text-[10px]`) because R817 wrote
  `min-h-10 min-w-10 … sm:min-h-0 sm:min-w-0` — 40 px below `sm`, *no* minimum from 640 px up. At 1280 /
  1024 the entry toolbar wraps under the title row, so a 17 px chip sits 2.3 px above 28 px buttons.
- Not a spacing-exception case: WCAG 2.5.8 lets an undersized target pass only if a 24 px circle centred
  on it does not intersect another target; the safe diameter here is 22 px. Not an inline-text
  exception either (the chip is a standalone button in a flex row).

## Options simulated (`/home/ubuntu/qa/r843-simulate.cjs`, DOM surgery on production, no source change)

`min-height` / `min-width` set on the live chip buttons, measured per chip: chip rect, title row, header
row, card, toolbar-on-same-line, page `scrollWidth`.

| width | MIN | chip | title row | card (Role 1 / Role 2 / Edu 1) | toolbar same line |
|---|---|---|---|---|---|
| 1280 | 24 | 29.9 × 24 / 27.7 × 24 | 22 → 24 | 656 → 658 / 636 → 638 / 390 → 392 | no (wraps) |
| 1280 | 28 | 29.9 × 28 / 28 × 28 | 22 → 28 | +6 each | no |
| 1024 | 24 | 29.9 × 24 / 27.7 × 24 | 22 → 24 | 792 → 794 / 772 → 774 / 504 → 506 | no |
| 1024 | 28 | 29.9 × 28 / 28 × 28 | 22 → 28 | +6 each | no |
| 768 | 24 | 29.9 × 24 / 27.7 × 24 | 22 → 24 | 606 → 606 / 586 → 586 / 376 → 378 | yes (Role) / no (Edu) |
| 768 | 28 | 29.9 × 28 / 28 × 28 | 22 → 28 | 0 / 0 / +6 | yes / no |

Page `scrollWidth === clientWidth` before and after at every width and MIN.

1. Keep — a real 2.5.8 failure on every desktop entry card with findings. Rejected.
2. Match the 28 px toolbar buttons (`sm:min-h-7`) — +6 px per card whenever the toolbar wraps, badge
   floats in a box 11 px taller than itself, no requirement asks for it. Rejected.
3. Move the chip into the toolbar row — reorders the card header that R834 locked (seven 40 px buttons
   on one line at 375) and changes the reading order title → chip. Rejected as out of proportion.
4. **Adopted**: `sm:min-h-0 sm:min-w-0` → `sm:min-h-6 sm:min-w-6` (24 × 24 minimum from `sm` up; the
   badge, its colours, text and the 40 px touch square below `sm` unchanged). Cost: +2 px per entry card
   only where the toolbar wraps under the title (1280 / 1024 two-column layout), 0 px where it shares the
   line (768). `min-w-6` also covers the `✓` "best practices applied" state, whose badge alone is narrower
   than 24 px.

## Fix (`src/components/EntryAuditChip.tsx`, one class string)

```diff
-className="flex min-h-10 min-w-10 items-center justify-center rounded sm:min-h-0 sm:min-w-0"
+className="flex min-h-10 min-w-10 items-center justify-center rounded sm:min-h-6 sm:min-w-6"
```

Reducer, events (hover / pin / Escape / outside / blur / expandable pointer-down), accessible name,
`aria-expanded` / `aria-controls`, panel markup and Builder call sites untouched.

## Tests

- `tests/entry-audit-chip.test.ts` — the R817 size assertion now requires `sm:min-h-6 sm:min-w-6` and
  rejects `sm:min-h-0` / `sm:min-w-0`; badge assertions unchanged. Fails on the R842 tree, passes with
  the fix. Suite 399 (no new test file; one assertion rewritten).
- Gates: vitest 399, `tsc -p tsconfig.app.json`, `tsc -b`, eslint 0 errors on the touched files,
  `npm run build`, `verify-dist` 123. Built CSS contains `.sm\:min-h-6{min-height:calc(var(--spacing) * 6)}`
  and the matching `min-w-6`.

## Deploy

- New Cloudflare account creds (`CLOUDFLARE_API_KEY=$CLOUDFLARE_NEW_GLOBAL_API_KEY`,
  `CLOUDFLARE_EMAIL=$CLOUDFLARE_NEW_ACCOUNT_EMAIL`, token / account-id vars unset), version
  `fc4280da`; production `index-DLEYf1mZ.js` `4dd0d989…` / `Builder-DNtCQi0w.js` `3decba61…` /
  `style-DlZg0_CA.css` `01e6399f…` SHA-identical to `dist/client/assets`.
- Native re-run of `r843-evidence.cjs` (no DOM surgery): 1280 / 1024 chips **29.9 × 24 / 27.7 × 24**,
  badge 29.9 × 17.3 / 27.7 × 17.3 unchanged, title row 24, chip bottom edge touches the wrapped toolbar
  (gap 0, no overlap); 768 chips 29.9 × 24, title row 24, cards 606 / 586 unchanged; 375 chips 40 × 40
  unchanged; page `scrollWidth === clientWidth` at all four widths; console 0.
  (The first post-deploy 1280 / 1024 runs on the shared profile still measured 17.3 — the profile had the
  previous `index.html` cached; re-running after the asset check showed the new bundle. Recorded so the
  harness lesson is not lost: check the loaded asset name before trusting a post-deploy measurement.)

## Production QA (independent testing agent)

- Six fresh cache-disabled Chrome contexts at 1280 / 1024 / 768 / 375, trusted pointer / keyboard /
  touch, axe (WCAG 2.2 tags), recordings `/home/ubuntu/qa/r843-qa/r843-{1280,1024,768,settled-desktop,
  settled-mobile}-readable.mp4`, raw `/home/ubuntu/qa/r843-qa/{all,supplement/all}.json`
  (216 passing assertions), storage / cookies / IndexedDB restored byte for byte in every context.
- **R843 objective: passed.** Warning chips 29.859 × 24 / 27.719 × 24 at 1280 / 1024 / 768, green `✓`
  chip 24 × 24 (badge 20.391 × 17.328 — the `min-w-6` case), all 40 × 40 at 375; badges unchanged; no
  overlap with any toolbar control (Role chips touch the wrapped toolbar edge at 1280 / 1024 / 375,
  gap 0; Education 26.5 / 8 / 143 / 8; Project 156.5 / 28.5 / 273 / 0); `scrollWidth === clientWidth`
  at all widths; header toolbars 38 × 28 / 40 × 40 and body toolbars 38 × 36 / 40 × 40 unchanged in
  size and x, wrapped rows 2 px lower; card deltas vs re-injected R842 CSS: Role +2 / Education +2 /
  Project 0 at 1280 / 1024, Role 0 / Education +2 / Project 0 at 768, all 0 at 375. Full-Builder axe:
  the R842 chip `target-size` violations are gone; 0 violations at 1280 top, 1024 top and 1024 scrolled
  to Experience. Behaviour: hover opens, click pins, second click hides, Escape closes, Tab focus opens,
  blur closes, `aria-expanded` tracks, findings listed; collapsed entries expand on trusted pointer-down
  and Enter; 375 first tap opens / second closes, panel x 16–344 above the pane switcher and its last
  row passes hit-testing. R842 captions present and the 60-char unbroken caption wraps visibly at both
  widths. Assets = dist SHA before and after; 405 GET / 0 non-GET / 0 AI / 0 checkout / 0 console or
  page errors / 0 failed requests.
- **Two pre-existing findings surfaced (not caused by R843, not fixed here):**
  1. Desktop findings panel of a chip near the card's left edge (short Project title `QA Project`, green
     chip) opens right-aligned to the chip (`sm:absolute sm:right-0 sm:w-64`) and lands at
     **x = −53.7 px**, clipping the findings text off the viewport
     (`/home/ubuntu/qa/r843-qa/supplement/1280-project-panel-left-clipping.png`; confirmed visually).
     Positioning code unchanged since R691 / R817. → **R844**.
  2. Full-Builder axe at one scrolled 1280 offset reports `target-size` on contact `Hide Location` /
     `Hide Website` toggles because the sticky section nav covers them to 24 × 16.4 exposed — a
     scroll-position occlusion artefact (same class as the R839 sticky-header notes), not a node size
     defect; the nodes are 24 × 24 unobscured.
- Not covered: physical devices, real screen readers, exports (unchanged code paths).

## Not changed / honest limits

- The chip now touches the wrapped toolbar's top edge at 1280 / 1024 (gap 2.3 → 0). Both are ≥ 24 px
  targets, so 2.5.8 is met by size; no overlap. A row gap would cost more height than the fix itself.
- Real screen-reader software and physical devices not covered.
- `resumeStrength` vs `resumeHealth` wording and LinkedIn non-English export remain queued; no fresh
  production evidence gathered this round, so untouched.
