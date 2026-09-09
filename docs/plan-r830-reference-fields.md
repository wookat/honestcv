# R830 — a reference's job title / employer leave the quarter-width nested pair (full row while the entry grid is narrower than 32 rem)

## Evidence (first-hand)

- Origin: R829's boundary note flagged the reference **relationship** boxes (72 px at 1024) as a
  different, shorter-value field. Checked instead of assumed: the two 72 px boxes are *job title*
  and *employer* — the same value classes as experience role / company, not a short enum.
- Corpus (186 retained imported resumes, parsed `role` / `company`, 14px Inter canvas width in a
  production-attached page): role p50 **122 px** / p90 201 / max 540; company p50 **108 px** /
  p90 159 / max 422. So the *median* real value is wider than the box at every viewport:

  | viewport | box inner (title = employer) | role > box | company > box |
  | -------- | ---------------------------- | ---------- | ------------- |
  | **1024** | **72 px**                    | 460 / 503  | 364 / 485     |
  | 1280     | 104 px                       | 435 / 503  | 271 / 485     |
  | 375      | 104 px                       | 435 / 503  | 271 / 485     |

  Root cause (source, `src/pages/Builder.tsx` References card): the name row was
  `grid gap-2 sm:grid-cols-2` with the name in one half and a nested `grid grid-cols-2 gap-2`
  holding title + employer in the other — a quarter of the card each, minus gaps and padding.
  The stored R815 fixture (`CTO` / `Acme`) fits, which is why every sweep since R815 passed.
- Production measurement with realistic values (`/home/ubuntu/qa/r830-simulate.cjs`, R829 bundle,
  fixture references `Priya Natarajan · Engineering Manager · Northstar Digital` and
  `Sam Lee · CTO · Acme`): `Engineering Manager` 142 px and `Northstar Digital` 108 px **clipped at
  1024, 1280 and 375** (72 / 104 / 104 px inner). Screenshots `qa/shots/r830/refs-before-*.png`.
- Simulation on production before touching source (same script: re-parent title + employer into the
  outer grid, apply the classes that already exist in the built CSS):

  | viewport | title / employer inner before → after | name inner | card height | `scrollWidth` |
  | -------- | ------------------------------------- | ---------- | ----------- | ------------- |
  | 1024     | 72 → **391** (each on its own row)    | 391        | 154 → 242   | 1009 = client |
  | 1280     | 104 → **242** (shared row)            | 519        | 154 → 198   | 1265 = client |
  | 375      | 104 → **242** (one column)            | 242        | 290 → 334   | 360 = client  |

  Corpus after: 1024 role 15/503 · company 2/485; 1280 / 375 role 32/503 · company 13/485
  (same tails as experience role / company after R829).

## Design

Reuse the R826/R829 primitives rather than a new layout:

```tsx
<div className={ENTRY_FIELDS_GRID}>            // '@container grid gap-2 sm:grid-cols-2'
  <Input className="col-span-full" aria-label="Reference full name" … />
  <Input className={ENTRY_WIDE_FIELD} aria-label="Reference job title" … />   // '@max-[32rem]:col-span-full'
  <Input className={ENTRY_WIDE_FIELD} aria-label="Reference employer" … />
</div>
```

- Name takes the whole row (a person's name is the card's headline, like role / company are for
  an experience entry's header). Title and employer become the `sm:grid-cols-2` pair — half a row
  at ≥ 32 rem, a full row each below it (the 1024–1215 editor-beside-preview band and < sm).
- Email / phone row untouched in this round. Measured, not assumed: the corpus holds only 13
  distinct e-mail addresses (12–28 chars; `qa/r830-emails.cjs`, 16px reading scaled to the
  input's 14px Inter → 96–192 px); **5 / 13 exceed the 178 px box at 1024**, 0 exceed 242 px.
  That is a real tail but a thin sample, and the fix would be a different choice (e-mail on its
  own row vs. phone) — queued as its own evidence item rather than folded in here.
- Rejected: keeping the nested pair and only widening the grid (still a quarter each); moving
  title / employer under name at every width (1280 has room for the shared row and the card
  would grow 44 px for nothing); shrinking padding / font (R826 / R829); wrapping values (P2).

## Tests

- New `tests/reference-fields-wide.test.ts` (3, source-level): the three fields sit directly in
  `ENTRY_FIELDS_GRID`; name `col-span-full`, title / employer `ENTRY_WIDE_FIELD`; no
  `grid-cols-2` between name and title. All 3 fail on the R829 tree (stash proof).
- `tests/entry-dates-wide.test.ts`: the plain `grid gap-2 sm:grid-cols-2` inventory drops 6 → 5
  (the reference name row joined the container-query grids).
- Gates: vitest **340**, `tsc -p tsconfig.app.json`, `tsc -b`, eslint 0 errors / 11 known
  warnings, build, verify-dist 123. CSS unchanged (`style-BOcUW4YK.css`; both classes existed).

## Deploy + production verification

- New account version `b516ffef`; production `index-CLPjcIwC.js` / `Builder-BQ9qJ7os.js`
  SHA-identical to `dist/client/assets`.
- `/home/ubuntu/qa/r830-verify.cjs` (deployed bundle, no DOM surgery): title parent is
  `@container grid gap-2 sm:grid-cols-2` on both cards; inner widths **391 / 242 / 242** at
  1024 / 1280 / 375, `Engineering Manager` / `Northstar Digital` fit at every width, card heights
  242 / 198 / 334, `scrollWidth` = `clientWidth`, corpus tails as simulated.

## Boundaries

- Reference cards grow 88 px at 1024–1215 and 44 px elsewhere.
- Reference e-mail still 178 px at 1024 (5 / 13 corpus addresses scroll); `Relationship` select
  and phone unchanged — queued.
- Involvement role (178 px at 1024) stays as is — that field's own corpus tail (15/503 at 178)
  matches the post-R829 experience role and there is no fixture value that clips.
