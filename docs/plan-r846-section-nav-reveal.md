# R846 — the Builder's sticky section nav keeps its highlighted chip in view

## Candidates measured first (production R845 bundle `6c869c33`, first-hand)

### Builder PDF lazy-loading (P2 since R813) — not a user-facing defect, no change

- Source: `src/lib/usePdfLength.ts` waits for `window.load` + `requestIdleCallback` (4 s timeout) and
  only then `import('./pdf')`; `Builder.tsx` calls `usePdfLength(shown)` during ordinary rendering and
  `AtsScoreValue.tsx` (dashboard rows) `usePdfPages`; no static import of `pdf.ts` anywhere, the initial
  Builder HTML preloads only `Builder-*.js`, the PDF chunk appears only via Vite's dynamic-import helper.
- Production timing without the service worker (`/home/ubuntu/qa/r846-{ttscore,pdfresp,longtask,inp,settle}.cjs`):
  slow 4G / 1280 — FCP 3276 ms, PDF request 3430 → 5520 ms (396 KB), first ATS score at 5739 ms;
  fast — FCP 660, PDF 660 → 840, score 938; slow 4G / 375 — FCP 3048, PDF 3060 → 5130. Long tasks after
  the PDF response: 192 / 77 ms (1× CPU: one 69 ms task).
- Typing while the PDF parses (60 characters, all accepted): 4× CPU throttle p50 99 / max 217 ms inside
  the PDF window vs p50 96 / max 109 outside; 1× CPU p50 26 / max 40 vs 25 / 31. Once measured, a
  10-key burst and a single key leave the score numeric (settle 1 ms) — no pending flash.
- Verdict: the chunk is large but loads after FCP + load + idle, the pending state is truthful
  (`ATS match score: measuring the exported PDF`), and typing latency is indistinguishable at normal CPU.
  A speculative optimisation would change nothing a user can see → not R846.

### Section nav highlight off-screen — confirmed defect, chosen

- `SectionNav` (`src/pages/Builder.tsx`) is a sticky bar whose chips sit in a `w-max` strip inside an
  `overflow-x-auto` box with the scrollbar hidden. The strip is 490 px for the seven sections; the box
  shows **262 px at 375**, **332 px at 1024**, **460 px at 1280** (`/home/ubuntu/qa/r846-nav.cjs`).
- The IntersectionObserver highlights the section in view (`aria-current`), but nothing ever scrolls the
  strip, so (`r846-nav2.cjs`, page scrolled by 600 px steps, 375):

  | page y | current section | chip visible |
  |---|---|---|
  | 0–1200 | Contact | yes |
  | 1800 | Summary | yes |
  | 2400–3000 | Experience | yes |
  | 3600 | Education | **no** |
  | 4200 | Skills | **no** |
  | 4800–5400 | Custom | **no** |

  At 1024 Projects / Skills / Custom are hidden, at 1280 Custom. While editing the second half of the
  resume the "where am I" indicator is simply not on screen and the visible chips are all unhighlighted.
  Keyboard focus does reveal chips (browser default on focus: after six Tabs `scrollLeft` = 208), so the
  gap is pointer / scroll users only.

## Options simulated on the production DOM (`/home/ubuntu/qa/r846-simulate.cjs`, 375 + 1024)

1. Keep — highlight stays off-screen at three of seven sections on phones.
2. Wrap chips onto two rows — nav grows 40–50 px on every width, R658's sticky-offset
   (`scroll-padding`) and every focus-clearance measurement change; rejected.
3. Show the scrollbar — ugly, still no reveal.
4. **Scroll the strip to the highlighted chip when the active section changes** (adopted): applying the
   computed `scrollLeft` at each page position puts every current chip fully inside the box —
   375: Education 51, Skills 171, Custom 228 (strip end, clamped); 1024: Skills 101, Custom 158;
   `window.scrollY`, nav top, page `scrollWidth` (360 / 1009) unchanged.

## Fix

- `src/lib/revealScroll.ts` → `revealScrollLeft(box, item, margin = 8)`: pure; returns the current
  `scrollLeft` when the item already shows, otherwise the position that brings it inside with an 8 px
  margin on the side it was hidden behind, clamped to `[0, scrollWidth − clientWidth]`.
- `SectionNav`: `ref` on the overflow box; `useEffect([active])` measures the `aria-current` chip
  against the box and calls `box.scrollTo({ left, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })`
  only when the value changes. No DOM, class, height or observer change; `scrollIntoView` deliberately
  not used (it may scroll ancestors / the page).
- Tests `tests/section-nav-reveal.test.ts` (+3 → **408**): production geometries through the helper
  (reveal right, reveal left, clamp at the strip end, no-overflow strip), source-level integration
  (fails on the R845 tree).

## Verification

- Gates: vitest 408, `tsc -b`, eslint 0 errors / 11 pre-existing warnings, build, verify-dist 123.
- Deployed **`bfdf80d3`** (new-account creds): production `index-Boo3IMxE.js` `a962f2e1…` /
  `Builder-CQHWRSXu.js` `8afc9b9d…` SHA-identical to dist, `/builder` preload names the new chunk,
  health 200.
- Native re-measure (`r846-verify.cjs`, 375 / 1024 / 1280): the current chip is fully inside the box at
  every page position (375: scrollLeft 0 → 51 → 171 → 228, back to Experience 135 with the chip at
  8–92; 1024: 0 → 101 → 158; 1280: Custom 30), page `scrollWidth` 360 / 1009 / 1265 unchanged, nav
  height 50 / 42 / 42 unchanged, console 0.
- Pre-existing, not R846: after scrolling back to y = 0 the highlight stays on the last section that
  entered the observer zone (Experience) because the zone `[110 px, 45 %]` is empty at the top of the
  page on a seeded resume; the first render shows Contact only because it is the initial state.

## Out of scope / next

- Sticky-nav highlight at page top (above), picker vertical drift on resize, LinkedIn headings in the
  five product languages (only with a real non-English export).
