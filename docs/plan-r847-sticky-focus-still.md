# R847 — focus inside a stuck sticky bar no longer moves the page

## Evidence first (production R846 bundle `39d76a09` / `Builder-CkUtg-3x.js`, first-hand)

- Candidate from the R846 QA note: "native keyboard focus scrolls the *page* when a chip in the sticky
  section nav takes focus". Probes `/home/ubuntu/qa/r847-evidence{,2,3}.cjs`, `r847-sweep.cjs`,
  `r847-simulate.cjs`, `r847-proto{,2}.cjs`, fresh no-cache contexts, seeded retained resume, bundle
  name checked before every measurement.
- Reproduction (page scrolled so the nav is stuck 61 px under the header):

  | viewport | action | `scrollY` before → after |
  |---|---|---|
  | 1280×800 | `.focus()` on a chip (any chip) | 2400 → 2021 (**−379**) — same at 800 / 1200 / 3000 |
  | 1280×800 | `.focus()` on the health-score button | 2400 → 2021 |
  | 1280×800 | header brand link | 2400 → 1972 (−428) |
  | 1280×800 | Shift+Tab health → Custom → Skills → Projects | 2400 → 2021 → 1642 → 1263 (**cumulative**) |
  | 1280×800 | mouse click health → dialog → Escape (focus return) | 2400 → 2021 → 1642 (net −758) |
  | 375×812 | chip focus / header | 2000 → 1659 (−341) / 1606 |
  | 375×500 | chip focus | 2000 → 1815 (−185) |
  | any | `.focus({ preventScroll: true })` | unchanged |
  | any | the bar's own `scrollTo` (R846 reveal) | unchanged |

  The jump equals *centre of the scrollport minus the padding* minus the control's centre
  (800: (112+800)/2 − 77 = 379; 375: (112+732)/2 − 81 = 341; 500: (112+420)/2 − 81 = 185) — Chrome's
  focus scroll is "centre if needed", and with `html { scroll-padding-top: 7rem }` (R658) a control
  whose rect lies inside the padding counts as "not visible", even though it sits in a stuck bar that
  the scroll cannot move. The bar stays put and the content behind it moves half a screen. A keyboard
  user tabbing along the nav loses their place on every step; a mouse user opening the health dialog
  and pressing Escape comes back to a different part of the resume. Ordinary off-screen controls also
  scroll, correctly — the defect is specific to stuck bars. The fixed-position pane switcher is not
  affected (2000 → 2000). Not Chrome-only in principle but only Chrome was measured.
- Production-DOM simulations before touching source:
  - `scroll-padding-top: 0` or `56px` removes the jump but breaks the R658 clearance contract
    (`98px` still jumps).
  - `scroll-margin-top` sweep on the controls (`r847-sweep.cjs`): chips need ≤ −56 px, the health button
    −51, header brand −96, header menu −104 — exact per-control values that also depend on the page's
    padding (4 rem on non-Builder pages, 7 rem in the Builder). Rejected: magic numbers per control per
    page.
  - JS `focusin` guard that reads the scroll position *at focusin* cannot work: the browser scroll
    happens before `focusin` fires (`yAtFocusin` already 2021).
  - JS guard that remembers the **last settled `scrollY` from the `scroll` event** (dispatched
    asynchronously, so the focus jump has not been reported yet when `focusin` fires) and restores it
    when focus enters a bar that is currently stuck — `r847-proto2.cjs`: every row above becomes
    "unchanged" at 1280×800, 375×812 and 375×500; Skills chip click still lands the section at 112 px;
    the health dialog still opens and returns focus; the not-yet-stuck nav at 375×500 (page top, chip
    at 520) is still scrolled into view by the browser (0 → 274) because the bar is not stuck; a normal
    field focus is untouched (the guard listens on the bars only); console 0. **Adopted.**

## Change

- `src/lib/stickyFocus.ts` (new): `stickyFocusRestore({ scrollY, lastScrollY, stuck })` (pure: the
  last settled position, or `null` when nothing moved / the bar is not stuck / no scroll seen yet);
  `isStuck(bar)` (`position: sticky` and `rect.top ≈ computed top`); `keepPageStillOnFocus(bar)` —
  one module-level passive `scroll` listener records `window.scrollY`; a `focusin` listener on the bar
  restores it with `window.scrollTo({ top, behavior: 'instant' })` before paint.
- `SectionNav` (`src/pages/Builder.tsx`): `ref={bar}` on the `<nav>` + `useEffect` installing the guard.
- `SiteHeader` (`src/components/Layout.tsx`): the guard on `headerRef` — the header is a stuck bar on
  every route with 4 rem / 7 rem padding, so its links, theme toggle, Menu and skip link had the same jump.
- No CSS, DOM, class, focus-order or R658 / R846 change. Tests `tests/sticky-focus.test.ts` +3 → **411**
  (pure decision against the measured positions; source-level integration for both bars).

## Verification

- Gates: vitest 411, `tsc -b`, eslint 0 errors / 11 pre-existing warnings, build, verify-dist 123.
- Deployed **`61de4415`** (new-account creds): production `index-C5WXJI9f.js` / `Builder-BwMWfWnK.js`,
  health 200. Native re-measure without any injected guard (`r847-proto2.cjs … off`): chip / health /
  brand / last header control 2400 → 2400 (1280) and 2000 → 2000 (375), Shift+Tab ×3 stays at 2400 /
  2000, health click → Escape 2400 → 2400 → 2400 with focus back on the button, Skills click lands the
  section at 112 px, unstuck nav still revealed by the browser, pane-switcher round trip 2000 → 0 → 2000,
  console 0.
- Independent production QA (testing agent, fresh contexts 1280 / 375 / 375×500): see
  `docs/handoff-context.md` R847 entry for the assertion counts and qualifications.

## Recorded, not R847

- Opening the mobile Menu at 375 mid-page moves `scrollY` 2000 → 2673 while the header grows 57 → 730 px
  and back to 2000 when it closes — in-flow header expansion with scroll anchoring (content stays visually
  in place), not per-link focus; present before R847 (inferred from the mechanism, not re-measured on the
  R846 bundle).
- axe at the 375 Skills scroll position: 2 `target-size` nodes (References / Military add-section
  controls) `partiallyObscured` by the sticky bars — the R843 scroll-offset artefact class.

## Out of scope / next

- Sticky-nav highlight at page top (observer zone empty at y = 0 on a seeded resume), picker vertical
  drift on resize, LinkedIn headings in the five product languages (only with a real non-English export).
