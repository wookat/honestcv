# R832 — the reference e-mail / phone row splits 4:3 (an address is wider than a phone number, even one with an extension)

## Evidence (first-hand)

- Origin: the R830 and R831 production QA both re-confirmed the boundary noted since R830 —
  `priya.natarajan@northstar.io` (187 px in 14px Inter) in the **178 px** reference e-mail box at
  1024. Measured the value classes before choosing a layout (`/home/ubuntu/qa/r832-refemail.cjs`,
  production R831 bundle, canvas width in the input's computed font):

  | field  | distinct real values | p50    | p90    | max                                    | > 178 (1024) | > 242 (1280 / 375) |
  | ------ | -------------------- | ------ | ------ | -------------------------------------- | ------------ | ------------------ |
  | e-mail | 13                   | 171 px | 188 px | 192 px `amelia.ling@college.ox.ac.uk`  | **5 / 13**   | 0                  |
  | phone  | 8                    | 105 px | 118 px | 118 px `555 - 555 - 5555` (16 chars)   | 0            | 0                  |

  So the two halves of the row hold values of very different width: the e-mail clips in 5 of 13
  cases at 1024 while the phone box is ≈60 px wider than any phone in the corpus.
- Source (`src/pages/Builder.tsx` References card): the row was a plain `grid gap-2 sm:grid-cols-2`,
  each field half of the 417 px card row minus gap and padding = 178 px at 1024 (242 at 1280).
- First simulation on production before touching source (`/home/ubuntu/qa/r832-simulate.cjs`, R815
  all-sections fixture, inline `grid-template-columns: minmax(0,3fr) minmax(0,2fr)` on the row):

  | viewport | e-mail inner before → after | phone inner before → after | row / card height | 4 longest addresses clipped | `scrollWidth − clientWidth` |
  | -------- | --------------------------- | -------------------------- | ----------------- | --------------------------- | --------------------------- |
  | **1024** | 178 → **219**               | 178 → **137**              | 36 / 242 → same   | **4 → 0**                   | 0                           |
  | 1216     | 226 → 277                   | 226 → 176                  | 36 / 198 → same   | 0 → 0                       | 0                           |
  | 1280     | 242 → **296**               | 242 → **189**              | 36 / 198 → same   | 0 → 0                       | 0                           |
  | 375      | 242 → 242 (one column)      | 242 → 242                  | 80 / 334 → same   | 0 → 0                       | 0                           |

  137 px holds every corpus phone (max 118) with ≈2 characters to spare; 219 px holds every corpus
  address (max 192) with ≈3 to spare. **Deployed as 3:2 first (version `ef9779b7`); the independent
  QA's boundary probe found the one value the corpus lacks — a phone with an extension,
  `(555) 210-4432 x123` = 138.3 px — clipped by 1 px at 1024** (input `clientWidth 161 / scrollWidth
  164`). Re-simulated 4:3 on the deployed bundle: 1024 e-mail 207 / phone **149**, 1280 281 / 204,
  both the 192 px address and the 138 px extension phone fit, heights unchanged → redeployed as 4:3.

## Design

```ts
// Reference e-mail / phone row: an address is wider than a phone number (even
// one with an extension), so the pair splits 4:3 instead of in half.
const REFERENCE_CONTACT_ROW = 'grid gap-2 sm:grid-cols-[minmax(0,4fr)_minmax(0,3fr)]'
```

- Asymmetric columns rather than the R826/R829/R830 container-query full rows: the full-row
  treatment would add a 44 px row to every reference card at 1024–1215 for a phone box that is
  already too wide; the 4:3 split fixes the e-mail at **zero height cost at every width** and keeps
  the pair on one line. `minmax(0,…)` keeps the columns shrinkable (the R824 lesson); the arbitrary
  template is already the repo's idiom (`ENTRY_NAME_ORG_DATE`, Jobs `2fr_3fr`, the Builder main).
- Rejected: `ENTRY_FIELDS_GRID` + `ENTRY_WIDE_FIELD` on both (+44 px per card at 1024–1215, phone on
  its own 391 px row); e-mail alone full-row with phone below (+44 px at *every* width ≥ sm); a
  fixed phone width (`auto` / `w-40`) — a fraction follows the card, a fixed width does not survive
  the 640–1023 single-column Builder where the card is 560+ px.

## Tests (342 → 344)

`tests/reference-contact-row.test.ts` (source-level): the constant exists with the 4fr/3fr template
and the `<div>` that opens immediately before `aria-label="Reference email"` uses it, with the phone
input following in the same grid. 2/2 fail on the R831 tree (stash-proved).
`tests/entry-dates-wide.test.ts` inventories the plain `grid gap-2 sm:grid-cols-2` grids that hold no
date pair — the reference row leaves that list, so its count is 5 → 4 (comment updated). Gates:
vitest 344, `tsc -p tsconfig.app.json`, `tsc -b`, eslint 0 errors / 11 pre-existing warnings, build
(CSS now emits `.sm\:grid-cols-\[minmax\(0\,4fr\)_minmax\(0\,3fr\)\]`), verify-dist 123.

## Deploy + verification

- New account version `4919e08f` (after `ef9779b7` = 3:2); production `index-CwlUIyft.js` /
  `Builder-gWMokFpR.js` / `style-Dbo2ALF3.css` SHA-identical to dist.
- Native re-measure on the deployed bundle (`/home/ubuntu/qa/r832-verify.cjs`, no DOM surgery):
  1024 `233.4px 175.1px` → inner **207 / 149**, 1280 `306.6px 229.9px` → **281 / 204**, 375 `268px`
  one column 242 / 242; row 36 / 36 / 80; 0 of 4 addresses clipped, extension phone fits; no
  overflow — identical to the simulation.
- Independent production QA (testing agent, `/home/ubuntu/qa/r832-qa/`): see the R832 entry in
  `docs/handoff-context.md` and the PR.

## Boundaries

- Phone box at 1024 is 149 px (was 178): every corpus phone (max 118) and a 19-character extension
  phone (138) fit; a 21+-character value (`+1 (555) 210-4432 ext. 12`) would scroll at 1024 only.
  E-mail box 207 px holds the widest corpus address (192) with ≈2 characters to spare; a 30+-character
  address scrolls at 1024 as before (was already the case at 178).
- Fractional grid tracks (`175.078px`) make a phone input report `scrollWidth 174 / clientWidth 173`
  for *every* value, including `555-1000` — a rounding artefact, not clipping; the oracle is canvas
  text width vs `clientWidth − padding` (testing skill).
- 375 stays one column (242 px), unchanged.
- Contact-section e-mail (the header row) is a different grid (R831) and unaffected.
