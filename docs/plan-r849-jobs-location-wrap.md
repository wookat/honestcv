# R849 — job-card company · location wraps instead of losing the location

## Evidence first (production R848 bundle `cf3502f0` / `index-XpivmtcV.js` + `Builder-B54X3m46.js`, first-hand)

Three carried candidates, all measured before any decision (`/home/ubuntu/qa/r849-*.cjs`, fresh
no-cache contexts, seeded retained resume, bundle name read from `performance.getEntriesByType`
before every measurement).

### (1) Month/year picker on resize — no defect

Real trigger `button[aria-label="Open date picker"]` (4 per Builder; the R848 probe's
`aria-haspopup="dialog"` matched nothing). Opened with a real pointer click after the trigger was
physically brought into view (`r849-picker2.cjs`), then resized with the picker open
(`r849-picker-resize.cjs`):

| step | Y | clientWidth × height | picker [l, t, r, b] | anchor right | transform | inside x |
|---|---|---|---|---|---|---|
| open 1280×800 | 1974 | 1265×800 | [228, 543, 452, 800] | 452 | none | yes |
| → 1024×800 | 2118 | 1009×800 | [26, 703, 250, 960] | 250 | none | yes |
| → 768×800 | 1974 | 753×800 | [316, 543, 540, 800] | 540 | none | yes |
| → 375×812 | 1974 | 360×812 | [8, 1545, 232, 1802] | 176 | translateX(56) | yes |
| → 375×500 | 1974 | 360×500 | same | 176 | translateX(56) | yes |
| → 768 → 1280 | 1974 | | identical to the opening rectangles | | none | yes |

Immediate and settled (500 ms) samples identical at every step; `scrollWidth = clientWidth`
throughout; console 0. The picker's right edge equals the field's right edge at every width, the
375 shift is exactly the R827 8 px-margin correction and clears on the way back (no accumulation). The
only thing that "moves" is the field itself when the two-column Builder reflows to one column — the
picker follows its field, which is the intended anchoring. Opening on a short viewport
(`r849-picker2.cjs`, 375×500 / 375×812) scrolls the page by 229 px so the 257 px panel fits below the
field — that is `scrollIntoView({ block: 'nearest' })` on open, the field stays visible above the
panel, no header / nav / pane-switcher overlap (`coveredBySwitcher 0`). At 1280 the panel bottom rounds
to exactly the viewport bottom (800) — edge contact, nothing hidden. **No user-visible defect; not
touched.**

### (2) Mobile Menu open shifting Y — design-consistent, no defect

Static pages (`r849-pricing-menu.cjs`, 375×812, `/pricing` and `/templates/`): header 57 px, the
open menu is an in-flow panel `[0, 56, 360, 600]` with 40 px link rows, scrollable, screenshot
`/home/ubuntu/qa/shots/r849-menu/01-menu-_pricing-375.png`. SPA header (R847 QA, Builder / Dashboard /
Jobs / ATS at 375×812 and 375×500): Y moves by exactly the header's in-flow growth (57 → 730 px, or to
the viewport height at 375×500 because of R676's `max-h-[calc(100dvh-3.5rem)]`) and returns on close;
Chrome's scroll anchoring keeps the content under the header visually still, per-link focus does not
move Y, Escape returns focus to the Menu button, a pointer down outside the header closes it. The
number changes; nothing on screen jumps. **UX-acceptable, not touched.** (`/resume-examples/` 404 seen
in the static probe is not a product route — the real route is `/examples/`.)

### (3) `/jobs` list rows lose the location — confirmed

`r849-jobs-trunc.cjs` on the live list (`button[id^="job-card-"] p.truncate`, 150 rows, query
"engineer"):

| width | rows truncated | location fully hidden | location partly hidden |
|---|---|---|---|
| 1280 | 19 | 2 | 17 |
| 1024 | 60 | 8 | 52 |
| 375 | 23 | 2 | 21 |

Examples: `J. J. Keller & Associates, Inc. · USA` reads as the company alone; `Lemon.io · LATAM, Europe,
USA, Canada, APAC` and `Creative Force · Europe, EMEA, UK, Germany, France, European timezones` lose
most of the places. Location is the dimension R716 / R718 built tiers and an empty state around; the
list is where the user scans it. Screenshots `/home/ubuntu/qa/r849-jobs-{1280,375}.png`; no page-level
horizontal overflow at any width.

Simulated in the live DOM before touching source (`r849-jobs-sim.cjs`, `r849-jobs-sim2.cjs`):

| width | two lines: still clipped / location lost | three lines: still clipped / location lost | rows growing (+16 / +32 px) |
|---|---|---|---|
| 1280 | 1 / 0 | 0 / 0 | 19 / 1 |
| 1024 | 13 / 3 | 2 / 0 | 47 / 13 |
| 375 | 2 / 0 | 1 / 0 | 21 / 2 |

## Decision

One class string in `src/pages/Jobs.tsx`: the company · location paragraph goes from `truncate` to
`line-clamp-3 break-words` (the title above it already uses `line-clamp-2 break-words` since R819; the
column is `min-w-0 flex-1`, so wrapping cannot widen the row). Three lines is the smallest clamp that
never hides the location on the 150 real rows at any of the three widths; two lines still lost it on
3 rows at 1024. Cost: 13 rows at 1024 grow by 32 px, 1–2 at 1280 / 375; most grow by one 16 px line
or not at all.

Rejected: keep `truncate` (measured information loss on a filter dimension); split company and
location into separate elements (changes the DOM the R819 test and the detail-pane locators key off
for the same visible result); a `title` tooltip (no touch equivalent, screen readers already get the
full text).

## Validation

- `tests/jobs-panes.test.ts`: R819's "remains a single truncated line" lock is replaced by the
  secondary-line lock it actually meant (muted, text-xs); new R849 block (+2, 416 → 418) locks
  `line-clamp-3 break-words`, no `truncate`, and the shrinkable column.
- Gates: vitest 418 / 418, `tsc -b`, eslint 0 errors (11 pre-existing warnings), build, verify-dist.
- Deployment, native re-measure and independent production QA: see handoff.
