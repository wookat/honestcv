# R835 — Coursework / Awards / Publications / Certifications get a visible caption on every field

## Evidence (first-hand, production R834 bundle `e3f06802`)

- R833's caption audit (`/home/ubuntu/qa/r833-labels.cjs`, visible captions only) counted 48 of the
  Builder's 76 filled controls without a visible caption. R833 fixed Involvement / Military (8); the
  next block is the four one-line entry cards — Coursework (5 fields), Awards (4), Publications (5),
  Certifications (4) = **18 controls** whose only name was a placeholder-style `aria-label`
  (`Course name`, `Where (school or platform)`, `When`, `Skills used (optional)`, `How you applied
  it`, `Award name`, `Awarded by`, `Why it's relevant`, `Publication title`, `Journal or conference`,
  `Publication type`, `Additional information`, `Certificate name`, `Issuer`, `How it's relevant
  (optional)`). Once the user types, the placeholder disappears and a filled card is four
  unlabelled boxes; the Experience / Education / Involvement / Military cards above it carry
  `Your role at <org>`-style labels since R798 / R833.
- Widths measured on the R815 all-sections fixture (`r835-simulate.cjs`, real Chrome, card =
  `closest('[class*="border p-3"]')` — the first run picked an empty ancestor and reported 36 px
  cards / 0 inputs; discarded): inner widths 1024 `391 / 287 / 70 / 391 / 161` (name / org / date /
  skill-or-type / description), 1280 `519 / 415 / 70 / 519 / 289`, 375 `242 / 242 / 102 / 242 /
  242`; no seeded value clips at any width; `scrollWidth === clientWidth`. So this round is a
  caption round, not a geometry round — the R816 organisation-spans-the-card layout is kept.
- Simulated on production before touching source (labels injected with the Experience label
  class, wrappers `space-y-1.5`, description label above the whole textarea + toolbar row): card
  heights 1024 Coursework 222 → 316 / Awards 178 → 238 / Publications 222 → 316 / Certifications
  178 → 238; 1280 222 → 302 / 178 → 238 / 222 → 302 / 178 → 238; 375 314 → 442 / 270 → 350 /
  314 → 428 / 270 → 350; every input gains a visible label; inner widths unchanged;
  `scrollWidth === clientWidth` at all three widths.

## Design

- Every field gets a `<Label htmlFor>` + stable control `id`:
  `cw-<id>-name | institution | date | skill | description`,
  `award-<id>-name | organization | date | description`,
  `pub-<id>-title | venue | date | kind | description`,
  `cert-<id>-name | issuer | date | description`. The label is the accessible name; the old
  `aria-label`s are removed (no double naming). Placeholders stay as examples.
- Captions are static questions in the Experience voice, kept short because the organisation +
  date row is 287 px wide at 1024: `Course name` / `Where did you take it? (school or platform)` /
  `When?` / `Skills you used (optional, up to 3)` / `How did you apply it?`; `Award name` / `Who
  awarded it?` / `When?` / `Why is it relevant?`; `Publication title` / `Where was it published?
  (journal or conference)` / `When?` / `Publication type (optional)` / `Additional information
  (optional)`; `Certificate name` / `Who issued it?` / `When?` / `How is it relevant? (optional)`.
  Dynamic `<org>` interpolation (R833) was rejected here: a course / award name is long
  (`Introduction to Computer Systems`) and would wrap the caption to two or three lines at 1024.
- Layout constants shared by the four cards: `ENTRY_NAME_ORG_DATE = 'grid gap-2
  sm:grid-cols-[minmax(0,1fr)_auto]'` (name wrapper `ENTRY_NAME_FIELD = 'sm:col-span-2'` spans the
  row; organisation + date share the second row from `sm` up, stack below), `ENTRY_DATE_FIELD =
  'w-32 sm:w-24'` (the R816 compact date box, unchanged), `ENTRY_DATE_WRAP = 'space-y-1.5
  sm:self-end'` (the date's label + input sit on the organisation's baseline even when the
  organisation caption wraps — Publications at 1024). The description label sits above the complete
  `ENTRY_TEXT_ROW` (textarea + toolbar), as in R833, so the toolbar is still the row's second child.
- Nothing else moves: state keys, preview, PDF / DOCX / TXT / MD, ATS, toolbar buttons and their
  R834 40 × 40 mobile size, `Button` / `Input` / `Label` components.
- Rejected: sr-only labels (the complaint is the *visible* caption), a single caption for the
  organisation + date pair (the date needs its own name), putting the description caption inside
  the flex row (it would take the textarea's column and push the toolbar).

## Tests (352 → 356)

- `tests/entry-visible-labels.test.ts`: for each of the 18 fields a `<Label htmlFor={`…`}>` and a
  control with the same `id={`…`}`; the 15 old placeholder-style `aria-label`s are gone; the date
  wrapper uses `ENTRY_DATE_WRAP`; each description label precedes its `ENTRY_TEXT_ROW`.
- `tests/entry-name-org-date.test.ts`: finds the controls by label / id instead of the old
  `aria-label`s; the organisation wrapper is a direct child of `ENTRY_NAME_ORG_DATE`, the name
  wrapper carries `ENTRY_NAME_FIELD`, the date input `ENTRY_DATE_FIELD`, the publication-type
  wrapper spans the name column; the pre-R816 nested `grid-cols-[1fr_5rem]` stays absent. The
  grid lookup is a depth-aware backward scan over `<div` / `</div>` (a fixed two-token lookbehind
  picked the wrong wrapper).
- On the R834 tree the two files fail 6 of 11 (the new assertions), pass 11 / 11 here.

## Gates

vitest 356 / 26 files; `tsc -p tsconfig.app.json`, `tsc -b`; eslint 0 errors / 11 pre-existing
warnings; `npm run build`; verify-dist 123 sitemap URLs. `prettier --check` warns on the two test
files and `Builder.tsx` exactly as on the base (no Prettier config in the repo; lint is eslint).
`git diff -w` on `Builder.tsx` is +84 / −30; the plain diff is larger only because the four
cards' JSX is re-nested one level.

## Deploy + native re-measure

New account version `b65ac357`; production `index-CmfIi55o.js` / `Builder-D2PzH0Y1.js` /
`style-CSnCqmMX.css` SHA-256-identical to `dist/client/assets`. `r835-verify.cjs` on the deployed
bundle (no DOM surgery): 18 / 18 controls per width have a visible label whose `for` equals the
control `id`, 0 `aria-label`s left, 0 duplicate ids, 0 clipped values, `scrollWidth ===
clientWidth` (1009 / 1265 / 360), console 0; inner widths byte-identical to R834; heights 1024
`302 / 238 / 316 / 238`, 1280 `302 / 238 / 302 / 238`, 375 `428 / 350 / 428 / 350`. The
Coursework card is 14 px shorter than the simulation at 1024 / 375 (316 → 302, 442 → 428);
inference: the injected captions were longer than the shipped ones and wrapped once more —
clipping and page width, the oracles, agree.

## Independent production QA (testing agent, `/home/ubuntu/qa/r835-qa/`)

Three independent real Chrome sessions 1024×768 / 1280×800 / 375×667, cache disabled, storage
restored byte for byte, recordings `r835-{1024,1280,375}-readable.mp4` +
`/home/ubuntu/screencasts/r835-*/…-edited.mp4`. **Every R835 oracle passed**: 18 exact captions
per width, `for` = `id`, Chrome accessibility name = caption, `combobox` role on the datalist
input, 0 duplicate ids, label clicks focus their control; all 18 seeded values fit at every
width (`allSeededValuesFit: true`), page width unchanged with each date focused; name full row,
organisation + date on one row with label bottoms aligned from `sm` (date border box 96 px), 375
stacked (128 px); description caption above textarea + toolbar; toolbar 38 × 36 desktop /
40 × 40 mobile (census 1280: 22 × 38 × 28 + 43 × 38 × 36; 375: 65 × 40 × 40); tab order name →
organisation → date → skill / type → description → enabled toolbar; 54 edits input = storage
JSON = preview (Coursework skills print `Skills: C · SQL`), one Ctrl+Z each byte-exact to the
app-written baseline; publication-type datalist 9 suggestions, native pick persists as
`Conference Paper`; Hide / Show and Delete + Undo on Coursework; R826–R834 unchanged (Experience
full row at 1024, LinkedIn 417 / 545 / 283, reference tracks 233.4 / 175.1 and 306.6 / 229.9,
12 / 12 dates fit, 12 calendar buttons 40 × 40, Involvement / Military captions, 375 pickers
x 8–232); ATS 79 at every width; one PDF (8 304 B, two A4 pages, `pdfinfo` valid, all four
sections' values in `pdftotext`); axe 0 violations at 1024 / 375; 3 × 50 GET / 0 non-GET /
1 download / 0 failed / 0 console / 0 page errors; 196 + 181 + 192 harness assertions passed,
2 retained harness failures (a `C, SQL` preview locator — the preview prints `Skills:
C · SQL` — and a Hide-button lookup while the mobile editor pane was hidden; both re-verified
by corrected checks, recorded in `harness-exceptions.json`); asset SHAs equal before and after; no AI generation or
checkout (only the automatic read-only `GET /api/ai/quota`).

QA deviations, none a product defect: reference phone 173 / 174 is the R832 rounding artefact;
the native datalist popup was opened at 1024 only (CDP keys do not drive it; OS keys do); the
QA machine has no native scrollbar at 375 (usable 257, page 375 / 375).

## Boundary

Cards grow by 60–128 px because captions are real content; no other Builder card changes. The
remaining caption-less controls from the R833 audit are the References card (name / title /
employer / e-mail / phone — R830 / R832 kept their `aria-label`s), custom-section entries and the
Skills / Summary single boxes; they queue behind LinkedIn non-English export and Builder
lazy-loading P2.
