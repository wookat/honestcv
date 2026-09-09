# R829 — role / company and degree / school take a full row while the entry grid is narrower than 32 rem (1024–1215 px)

## Evidence (first-hand)

- Origin: R826's boundary note — after the date fix, the one remaining clipped input on
  production `/builder` @1024 was the education **School** box (`University of Texas at
  Austin` 189 px in 178 px).
- Focused measurement on production, R828 bundle (`/home/ubuntu/qa/r829-evidence.cjs`: every
  visible text `<input>`, text width by canvas in the input's own computed font
  `14px Inter` vs `clientWidth − padding`; also each of 186 retained imported resumes' parsed
  `school` / `degree` / `role` / `company` values measured against the same box width):

  | viewport | `clientWidth` | role / company / degree / school inner | fixture clipped | corpus > box (school / degree / role / company) |
  | -------- | ------------- | -------------------------------------- | --------------- | ----------------------------------------------- |
  | **1024** | 1009          | **178 px**                             | **1** (school)  | **90/201 · 26/207 · 53/503 · 33/485**           |
  | 1280     | 1265          | 242 px                                 | 0               | 5/201 · 19/207 · 32/503 · 13/485                |
  | 375      | 360           | 242 px (one column)                    | 0               | 5/201 · 19/207 · 32/503 · 13/485                |

  Root cause (source): experience `role` / `company` and education `degree` / `school`
  share a `sm:grid-cols-2` row inside `ENTRY_FIELDS_GRID`; at `lg` (1024) the editor column
  beside the preview is 417 px, so each half is 202 px outer / 178 px inner. R826 widened
  only the place field and the date pair in that grid; the name pair kept the half row.
  The corpus figures are prioritisation only (they include some placeholder / imported
  noise) — the fixture measurement is the defect proof.
- Simulation on production before touching source (`/home/ubuntu/qa/r829-simulate.cjs`:
  inject `@container not (width >= 32rem) { .r829-wide { grid-column: 1 / -1 } }` and add
  the class to the four wrappers, re-measure):

  | viewport | school inner before → after | fixture clipped | exp / edu field grid height | `scrollWidth` |
  | -------- | --------------------------- | --------------- | --------------------------- | ------------- |
  | 1024     | 178 → **391**               | 1 → **0**       | 184 → 248 px                | 1009 = client |
  | 1215     | 178 → 391                   | 0 → 0           | 184 → 248 px                | unchanged     |
  | 1216     | 242 → 242                   | 0               | unchanged                   | unchanged     |
  | 1280     | 242 → 242                   | 0               | unchanged                   | unchanged     |
  | 375      | 242 → 242                   | 0               | unchanged                   | unchanged     |

  Corpus after at 1024: school 1/201, degree 6/207, role 15/503, company 2/485. Console errors 0.

## Design

Reuse R826's mechanism, nothing new: add `ENTRY_WIDE_FIELD` (`@max-[32rem]:col-span-full`)
to the four name-field wrappers. Below `sm` the grid is already one column (no change); from
32 rem up (≥ 1216 viewport at `lg`, or the editor alone at 640–1023) the row stays two
columns exactly as before. Only the 1024–1215 `lg` band with the preview beside the editor
changes: the experience and education cards grow 64 px each (two extra rows), the same
trade R826 made for the date pair.

Rejected:

- Widening only `school` (the one clipped fixture value): a lone full-width field between two
  half-width ones reads as a layout accident; the corpus shows roles (53/503) and degrees
  (26/207) clip at the same width, and the row is one semantic pair.
- A three-column row or smaller font: R826 already rejected both for the same grid.
- Wrapping long input values (design change, queued separately as "over-width single-line
  input values") — this is about a box that is narrower than typical values, not about
  exceptional values.
- Changing the `lg` editor / preview split: affects every section for one band.

## Verification

- `tests/entry-names-wide.test.ts` (source-level): each of the four name-field wrappers is
  `<div className={\`space-y-1.5 ${ENTRY_WIDE_FIELD}\`}>`; the wide class is still the
  container query, not a viewport breakpoint. 1/2 fails on the R828 tree (stash proof).
- `tests/entry-dates-wide.test.ts` (R826): the per-entry wide-field count is now data — 4 for
  experience / education, 2 for the three others; the six plain grids unchanged.
- Gates: vitest 337, `tsc -p tsconfig.app.json`, `tsc -b`, eslint 0 errors / 11 known
  warnings, build, verify-dist 123. Built CSS is byte-identical to R826's
  (`style-BOcUW4YK.css` — the class already existed; only the Builder chunk changes).
- Deploy: new account version `1c67f923`, 30 assets; production `index-BOaZOKal.js` /
  `Builder-ClXndUaQ.js` SHA-identical to `dist/client/assets`.
- Production re-measurement (same helper, R829 bundle): 1024 name fields inner 178 → **391**,
  fixture clipped **0**, corpus school 1/201 · degree 6/207 · role 15/503 · company 2/485;
  1280 and 375 inner 242, clipped 0, geometry unchanged; `scrollWidth = clientWidth` at all
  three; console errors 0.

## Boundaries

- 1024–1215: experience / education cards are 64 px taller than R826 left them.
- Other half-row inputs that the sweep still flags against the *role* corpus are different
  fields (involvement role 178 px @1024, reference relationship 72 px) and hold shorter
  values by design — left as observed, not in scope.
- Over-width single-line values at any width still scroll inside the input (P2 design item).
