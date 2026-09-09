# R817 — Builder entry-audit chip: opens on a tap, is a button, closes on tap-outside / Escape

Chain: R816 (#1034) → this PR.

## Evidence (production, before the fix)

Direct measurement on `https://cv.zalize.com/builder` with the R815 all-sections fixture
(`/home/ubuntu/qa/r817-evidence.cjs`, `r817-geometry.cjs`, `r817-touch-debug.cjs`; 375 × 667
touch-emulated and 1280 × 800 mouse):

- The chip was a `<span tabIndex=0 aria-label=…>` (no role). axe **incomplete**:
  `aria-label attribute is not well supported on a span with no valid role attribute`.
  Visual badge 20.4 × 17.3 px at both widths — the only hit area on a phone.
- The findings panel was shown by `onMouseEnter` / `onFocus` and hidden by
  `onMouseLeave` / `onBlur` on the wrapper. On a real touch tap Chrome emits
  `pointerdown → pointerup → pointerleave → mouseenter → focus → click → mouseleave`;
  the panel appeared for one frame and `mouseleave` hid it again — **the panel could not be
  opened by touch at all** (`tap events … panel none`).
- When it did show (hover on desktop, focus via keyboard) it was a `position: fixed` bottom
  sheet at 375 (`top 493, bottom 587`, viewport 667) sitting over the `Company` / `Location`
  inputs of the same card, and the only way off was moving focus (R691 added Escape).
- There was no tap-outside dismissal: a pinned or focused panel stayed until focus moved.

## Fix

`src/components/EntryAuditChip.tsx` (extracted from `Builder.tsx`), `src/lib/auditChip.ts`
(shared types / explanations / reducer — kept out of the component file so Fast Refresh keeps
working):

- The chip is a real `<button type="button" aria-label aria-expanded aria-controls>`; the
  panel carries the `useId()` id and is no longer `aria-hidden`.
- Hit area `min-h-10 min-w-10` below `sm`, badge unchanged (`sm:min-h-0 sm:min-w-0`), so the
  phone gets a 40 × 40 target and the desktop badge stays 20.4 × 17.3.
- Visibility is a small reducer (`hot` = hover / focus, `pinned` = opened by click or tap,
  `dismissed` = Escape or a closing click until the next reveal):
  `visible = pinned || (hot && !dismissed)`.
  - `enter` / `focus` → hot; `leave` → not hot; `blur` / `outside` → unpinned + not hot.
  - `toggle` (click) → pin, or unpin **and** dismiss the hover state — because a second tap on
    the still-focused chip arrives as `mouseenter → click` with no blur / mouseleave, a plain
    `pinned = !pinned` left the panel visible through `hot` (found by the production probe;
    the first unit test modelled the second tap wrongly and was corrected to the measured
    sequence).
  - `escape` → unpin + dismiss; the chip keeps focus, Enter reopens.
- While visible the component listens for `keydown` Escape and document `pointerdown`
  outside the wrapper (`outside`). Listeners are added only while the panel is open.
- Expandable chips (collapsed entries) keep their `onPointerDown → onExpand` behaviour;
  keyboard Enter / Space (`click.detail === 0`) expands too.
- The mobile panel stays a fixed bottom sheet above the pane switcher (`inset-x-4 bottom-20`)
  — it now opens only on an explicit tap and closes on the next tap anywhere outside it, so no
  control under it is unreachable; a tap on a covered input first closes the sheet, the second
  tap focuses the input. Desktop keeps the absolute `sm:top-full sm:right-0 sm:w-64` popover.

Rejected: an in-flow panel that pushes the card open (moves every control on hover on
desktop); `position: absolute` under the chip on mobile (still covers the same inputs, and is
clipped by the card); a `<details>` element (no hover reveal, no `aria-expanded` on hover).

## Tests

`tests/entry-audit-chip.test.ts` (268 → 272): the measured tap sequences (first tap opens,
second tap on the focused chip closes, third reopens; desktop hover / click / click), outside /
blur / Escape close a pinned panel and hover or click reopen it; renders `<button type=button>`
with `aria-label`, `aria-expanded`, `aria-controls` = panel id, panel not `aria-hidden`;
mobile `min-h-10 min-w-10` + `sm:min-h-0 sm:min-w-0`; badge classes unchanged; nothing renders
for an unfilled or finding-free-and-unchecked entry.

Gates: vitest 272 / `tsc -p tsconfig.app.json` / `tsc -b` / eslint (0 errors, 11 pre-existing
Builder warnings) / build / verify-dist (123 URLs) green.

## Verification

`/home/ubuntu/qa/r817-verify.cjs` (`QA_ORIGIN=… W=375|1280`, cache disabled, storage restored
in `finally`), local `vite preview :4176` then production after deploy:

- **375 — 17/17** local and production: `<button type=button>` 40 × 40, badge 20.4 × 17.3, panel
  hidden at rest (`aria-expanded=false`, not `aria-hidden`); a touch tap opens the fixed sheet
  at `16–359 × 493–587` (above the 587+ pane switcher, inside 667); second tap closes
  (`aria-expanded=false`); third reopens; a tap on the card's padding (`target p-4`) closes it;
  the `Job title` input in the former sheet area takes focus on the next tap; keyboard focus
  opens, Escape closes and keeps focus on the chip, Enter reopens, Tab away closes;
  `scrollWidth 375 = visualViewport 375`, scale 1; stored résumé unchanged; 0 console / page
  errors.
- **1280 — 14/14** local and production: badge 20.4 × 17.3 is the button; hover opens the
  absolute popover under the chip (top 469 ≥ chip bottom 465); leaving closes; click pins it
  through pointer leave; click outside closes; same keyboard round trip; 0 errors.
- axe (production 375, `Page.setBypassCSP`): **0 violations**; the chip passes
  `button-name`, `aria-allowed-attr`, `aria-valid-attr`, `nested-interactive`, `color-contrast`;
  the former "aria-label on span" incomplete is gone.
- Deploy: 31 assets uploaded, route listing still `code: 10000` (token lacks route read;
  not redeployed for it). Production `index-Bfv-I1_U.js`, `Builder-Dec1GIY-.js`,
  `style-CY3nITIT.css` SHA = local `dist/client`.

Harness notes: the first local run after `npm run build` hit a stale `vite preview`
(old index hash 404) and a browser-cached `index.html` — restart preview after every build and
run probes with `Network.setCacheDisabled`. The first verify script read `experiences` (the
schema key is `experience`) and picked an outside coordinate inside the wrapper; both were
script faults, corrected.

## Boundaries

- The mobile sheet still overlays whatever sits at 493–587 while open — by design (bottom
  sheet); it is now opt-in and dismissible by any outside tap, Escape, or a second tap.
- Hover-only reveal on desktop still covers inputs under the popover until the pointer leaves
  (unchanged behaviour, Escape dismisses).
- Not measured: 640–1023 px; screen-reader announcement of `aria-expanded` changes (semantics
  verified via axe / DOM only).
