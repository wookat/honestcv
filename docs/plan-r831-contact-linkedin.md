# R831 — the Contact LinkedIn field spans the whole row (it was a half-width cell with an empty half beside it)

## Evidence (first-hand)

- Origin: R830's queue said "reference e-mail row next". Measured the whole Contact section first
  instead (`/home/ubuntu/qa/r831-contact.cjs`, production R830 bundle): all seven contact inputs
  share `grid gap-3 sm:grid-cols-2` and have the same usable width — **189 px at 1024, 253 at 1280,
  268 at 375** (`clientWidth − padding`, 14px Inter).
- Corpus: 21 distinct real LinkedIn profile URLs from the retained imports (LinkedIn "Save to PDF"
  exports, Chrome-printed CVs, r746/r773/r776 fixtures; synthetic placeholders such as
  `linkedin.com/in/you` / `alexmorgan-example` excluded), rendered in the input's computed font
  (`/home/ubuntu/qa/r831-linkedin.cjs`):

  | value                                        | width  |
  | -------------------------------------------- | ------ |
  | `linkedin.com/in/aprot`                      | 140 px |
  | `linkedin.com/in/wyattmyers`                 | 182 px |
  | `linkedin.com/in/geneva-brooks`              | 206 px |
  | `linkedin.com/in/sumityadav-dev`             | 211 px |
  | `linkedin.com/in/alexandredeboutray`         | 237 px |
  | `linkedin.com/in/sam-bush-21040756`          | 243 px |
  | `linkedin.com/in/jasmin-baldrich-5540201a7`  | 288 px |
  | `linkedin.com/in/jean-raphael-demol-66682a5` | 302 px |

  n = 21, **p50 211 px**: **13/21 clip at 1024 (189 px)**, 2/21 at 1280 (253) and 375 (268) — the
  two are LinkedIn's *default* unclaimed URLs (`name-name-9 chars`), which the importer stores
  verbatim. The `linkedin.com/in/` prefix alone is 106 px, leaving room for ≈12 slug characters at
  1024; real slugs are 5–26 characters. The product sample (`linkedin.com/in/jordanreyes`, 183 px)
  fits, which is why every sweep since R815 passed.
- The other six contact fields against the same corpus (114 parsed resumes,
  `/home/ubuntu/qa/r831-corpus.cjs`): full name 0/113, phone 0/112, location 0/59 over 189 px;
  e-mail p90 183 px (0/112 over 189; the separate 13-address reference corpus has one at 192);
  title 1/109 (a 311 px summary sentence pasted as title); website 0/5 real values over 189
  (`github.com/ronstr8` 127, `reallygreatsite.com` 126). Only LinkedIn has evidence.
- Layout fact that makes the fix free: LinkedIn is the **seventh and last** field, so in the
  two-column grid it already sits alone on the fourth row with an empty right half at every width
  ≥ `sm`. Spanning the row changes no other cell and no height.
- Simulation on production before touching source (`/home/ubuntu/qa/r831-simulate.cjs`, adds
  `col-span-full` to the LinkedIn cell and re-measures):

  | viewport | LinkedIn inner before → after | grid width | grid height | corpus clipped before → after |
  | -------- | ----------------------------- | ---------- | ----------- | ----------------------------- |
  | **1024** | 189 → **417**                 | 443        | 290 → 290   | **13 → 0**                    |
  | 1216     | 237 → 513                     | 539        | 290 → 290   | 3 → 0                         |
  | 1280     | 253 → **545**                 | 571        | 290 → 290   | 2 → 0                         |
  | 640      | 248 → 533                     | 559        | 290 → 290   | 2 → 0                         |
  | 375      | 268 → 268 (one column)        | 294        | 514 → 514   | 2 → 2                         |

  `documentElement.scrollWidth − clientWidth = 0` everywhere; website / location rows unchanged.

## Design

`src/pages/Builder.tsx`, Contact section, one wrapper class:

```tsx
<div key={key} className={`space-y-1.5 ${key === 'linkedin' ? 'col-span-full' : ''} …`}>
```

- Unconditional `col-span-full` rather than the R826/R829/R830 `@max-[32rem]:col-span-full`
  container query: those rows had a *partner* cell that the wide layout keeps beside them, so the
  full row had to be limited to the narrow (1024–1215) case. Here the partner cell is empty, so
  the full row costs nothing at any width and also fixes the two default-URL values at 1280 / 640.
  `col-span-full` in the single `<sm` column is a no-op.
- Rejected: making Website + LinkedIn both full-row (adds a 56 px row at every width for a field
  whose real values all fit); shrinking the URL by hiding `linkedin.com/in/` in the editor (the
  value is stored and exported verbatim — the editor must show what the PDF prints; the P2
  "wrap long single-line values" design item is separate); moving LinkedIn into a
  `@container` query (no partner to protect).

## Tests (340 → 342)

`tests/contact-linkedin-wide.test.ts` (source-level): the Contact tuple list has an odd count with
`linkedin` last (so the cell is alone on its row), and the cell wrapper carries the
`key === 'linkedin' ? 'col-span-full'` class. The second test fails on the R830 tree (stash-proved),
passes with the change. Gates: vitest 342, `tsc -p tsconfig.app.json`, `tsc -b`, eslint 0 errors /
11 pre-existing warnings, build, verify-dist 123. CSS unchanged (`col-span-full` already emitted).

## Deploy + verification

- New account deploy; production `index-Z5FlP9-C.js` / `Builder-BtwVjbXB.js` SHA-identical to dist.
- Native re-measure on the deployed bundle (no DOM surgery): 1024 inner **417** / clipped 0,
  1280 **545** / 0, 375 268 / 2 (the two default URLs) — identical to the simulation.
- Independent production QA (testing agent, `/home/ubuntu/qa/r831-qa/`, three real-Chrome sessions
  1024×768 / 1280×800 / 375×667, cache disabled, storage restored byte for byte, recordings
  `r831-1024-readable.mp4` / `r831-1280-readable.mp4` / `r831-375-readable.mp4`): LinkedIn usable
  417 / 545 / 283 (no native scrollbar on that machine); edges align with full name / title; the
  three other pairs unchanged; contact grid 290 / 290 / 514; all five oracle URLs fit at 1024 and
  1280 (`scrollWidth = clientWidth`), 4/5 at 375 with the 302 px default URL clipping as expected;
  15 real edits input = storage = preview, one Undo each restores the app-written baseline byte for
  byte; Hide/Show eye toggles `aria-pressed`, `Hidden` tag and preview, 40×40 at 375; tab order
  fullName → title → (eye) email → (eye) phone → (eye) location → (eye) website → (eye) linkedin;
  R829 / R830 rows, 12/12 dates, 40×40 calendar buttons, Reference type, ATS 79, preview, one valid
  2-page A4 PDF containing the LinkedIn URL; axe 0 at 1024 / 375; 123 GET / 0 non-GET / 1 download /
  0 failed / 0 console / 0 page errors; bundles unchanged before / after. No new pre-existing defect.

## Boundaries

- 375 stays one column: a LinkedIn default URL (≥ 288 px) still scrolls in the 268–283 px input —
  inherent to the single-line input; the P2 wrap-long-values design item covers it.
- Reference e-mail at 1024 (178 px, `priya.natarajan@northstar.io` 187 px) is unchanged and
  re-confirmed by QA — that row has a real partner (phone), so it needs the container-query
  treatment and a height trade-off; still queued.
- Contact title: one 311 px corpus value is a summary sentence pasted as the title — a data
  problem, not a layout one.
