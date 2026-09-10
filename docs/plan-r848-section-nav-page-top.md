# R848 — the section-nav highlight follows the page back to the top

## Evidence first (production R847 bundle `61de4415` / `Builder-BwMWfWnK.js`, first-hand)

- Three candidates carried from the R846 / R847 QA notes: (1) highlight stale at the page top,
  (2) month/year picker drift on viewport resize, (3) mobile Menu open shifting page Y.
  Probes `/home/ubuntu/qa/r848-evidence.cjs` (observer-zone geometry per scroll position) and
  `r848-evidence2.cjs` (realistic return-to-top gestures at 1280×800 and 375×812), fresh no-cache
  contexts, seeded retained resume, bundle name checked before every measurement.
- (1) reproduced with real gestures. Zone = `rootMargin: -110px 0px -55% 0px` → viewport band
  [110, 45 % of the height]. Anchors at the page top: `target` 473, `contact` 853, `summary` 1273,
  `experience` 1485, `education` 2297 … (all below the band, nothing intersects):

  | viewport | gesture from Y=2400 / 2000 | Y after | highlighted chip |
  |---|---|---|---|
  | 1280×800 | one wheel tick up | 0 | **Education** |
  | 1280×800 | scrollbar thumb drag to the top | 0 | **Education** |
  | 1280×800 | Ctrl+Home / synthesised fling | 0 | Contact |
  | 375×812 | one wheel tick up | 0 | **Experience** |
  | 375×812 | mobile pane Edit → Preview → Edit at the top | 0 | **Experience** |
  | 375×812 | Ctrl+Home | 0 | Contact |

  Screenshot `/home/ubuntu/qa/r848-stale-top.png`: page at the very top, Contact card fully visible,
  chip bar says Education. Root cause in `SectionNav`'s observer: `if (first) setActive(first)` — when
  the intersection set is empty the previous choice is kept, so any return to the top that the observer
  only sees the *end* of (no anchor ever enters the band on the way) leaves the chip on the section the
  user left. Programmatic and keyboard paths happened to pass an anchor through the band mid-way and
  self-corrected; wheel / drag / pane switch did not.
- (2) picker drift: `button[aria-haspopup="dialog"]` found 0 triggers at 1280 — the probe used the wrong
  selector, so **no evidence either way**; not touched.
- (3) mobile Menu: R847 QA measured Y 2000 → 2673 → 2000, equal to the header's in-flow expansion
  (57 → 730 px) under scroll anchoring; per-link focus does not move Y. Layout consequence, not a focus
  defect; whether it is a UX problem needs a design decision — not touched this round.

## Decision

Smallest change that makes the observer's *empty* state truthful, with the full-state behaviour
unchanged:

- New pure function `src/lib/activeSection.ts` `activeSection(keys, visible, tops, zoneTop)`:
  first intersecting section in `keys` order (exactly the old rule) → else, when nothing intersects,
  the last laid-out section whose anchor top is already above the zone (user is in a gap below it) →
  else the first laid-out section (page top above everything) → `null` when no anchor is laid out
  (hidden mobile pane) so the caller keeps its previous choice.
- `SectionNav` observer keeps a `Map` of the observed anchors, measures `getBoundingClientRect().top`
  for the laid-out ones inside the callback, and calls `activeSection`. `rootMargin` unchanged
  (`SECTION_ZONE_TOP = 110` shared between the margin and the decision).
- Rejected: enlarging the zone to the viewport top (Contact would highlight while the Target-job card is
  what the user sees; also changes every mid-page choice), a `scroll` listener (the observer already
  fires on the transition that matters), resetting to `keys[0]` at `scrollY === 0` (misses the gap
  case and pane switch), `scrollIntoView`-style reveal changes (R846 contract).

## Validation

- `tests/section-nav-active.test.ts` (+5, 411 → 416): first-intersecting preference, page-top fallback
  with the production anchor offsets, gap fallback, hidden-pane `null`, source guard that the Builder
  observer calls the shared decision with the shared zone constant.
- Gates: vitest 416 / 416, `tsc -b`, eslint 0 errors (11 pre-existing warnings), build, verify-dist 123.
- Deployed `cf3502f0` (new-account creds): production `index-XpivmtcV.js` / `Builder-B54X3m46.js`
  SHA-identical to dist, health 200. Recorded: the first re-run of `r848-evidence2.cjs` right after the
  deploy still loaded `index-C5WXJI9f.js` (edge served the previous HTML) and reproduced the defect —
  bundle name must be read before trusting a measurement; the re-run on `Builder-B54X3m46.js` passed.
- Native re-measure on the new bundle (`r848-evidence2.cjs`, `r848-debug.cjs`): 1280 wheel → Contact,
  scrollbar drag → Contact, Ctrl+Home / fling → Contact; 375 wheel → Contact, pane trip from the top →
  Contact; mid-page positions unchanged (2400 → Education, 2000 → Experience); console 0.
- Independent production QA: see handoff.
