# R836 — References and the Education GPA / Minor / Details boxes get a visible caption on every field

## Evidence (first-hand, production R835 bundle `b65ac357`)

- The caption audit (`/home/ubuntu/qa/r833-labels.cjs`, visible captions only — `label[for]`,
  `aria-labelledby`, ancestor `<label>`) on the R815 all-sections fixture at 1024:
  `fields=76 {"visible":56,"srOnly":0,"none":20}` (`/home/ubuntu/qa/r836-labels-1024.txt`). The 20
  caption-less controls split into four kinds:
  1. **References — 5 text fields** (`Reference full name / job title / employer / email / phone`),
     named only by a placeholder-style `aria-label`; a filled card reads
     `Priya Natarajan · Engineering Manager · Northstar Digital · priya.natarajan@… · (555) …`
     with nothing saying which box is which. R830 / R832 changed the geometry and kept the
     `aria-label`s.
  2. **Education GPA / Minor / Details — 3 fields**, same pattern (`GPA (optional)`,
     `Minor (optional)`, `Education details (optional)`), sitting under a card whose degree /
     school / location / dates already carry visible labels since R798.
  3. **Professional summary textarea** (1) and **custom-section title + entries** (2 per
     section): single-control or self-titled blocks — see *Deferred* below.
  4. **End dates** (one per dated entry, `MonthYearField`): the start-date label
     (`When were you at <org>?`) captions the pair and the end box keeps the accessible name
     `End date` — the R833 / R835 decision, unchanged here.
- Widths measured on the deployed bundle with realistic values (`r836-simulate.cjs`, real Chrome;
  reference `Priya Natarajan / Engineering Manager / Northstar Digital /
  priya.natarajan@northstar.io / (555) 210-4432 x123`, GPA `3.8/4.0`, Minor `Mathematics`,
  Details `Dean's List; thesis on distributed consensus`): inner widths 1024
  `391 / 391 / 391 / 207 / 149` (name / title / employer / e-mail / phone) and `178 / 178 / 161`
  (GPA / Minor / Details); 1280 `519 / 242 / 242 / 281 / 204`, `242 / 242 / 289`; 375 all `242`
  except GPA / Minor `104`. Every reference value and GPA / Minor fits at every width; so for
  those eight controls this is a caption round, not a geometry round.
- Simulated on production before touching source (labels injected with the Experience label
  class, `space-y-1.5` wrappers, Details label above the whole input + toolbar row): reference
  card 1024 `242 → 322`, 1280 `198 → 258`, 375 `334 → 434`; education card `392 → 432`,
  `278 → 318`, `472 → 526`; `scrollWidth === clientWidth` (1009 / 1265 / 360) at all widths.
- **Education Details geometry is a separate defect**, measured but not fixed here: the value
  above is 291 px against a 161 px box at 1024 (289 at 1280, 242 at 375), and the retained
  import corpus (`r831-corpus.cjs` over `r776-text-replay.json`) gives
  `education details: n=64 p50=536 p90=541 max=2259 inner@1024=161 over=64` — every real
  Details value overflows the single-line box at every width. That needs a design decision
  (textarea vs wider row vs wrapping) and its own measured round; captions do not change it.

## Design

- Every field gets a `<Label htmlFor>` + stable control `id`:
  `ref-<id>-name | title | employer | email | phone`, `edu-<id>-gpa | minor | details`. The label
  is the accessible name; the eight old `aria-label`s are removed (no double naming).
- Reference captions follow the R833 contextual voice because a person's name is short:
  `Full name`; `` `${name}'s job title` `` (fallback `Their job title`); `` `Where does ${name}
  work?` `` (fallback `Where do they work?`); `Email`; `Phone`. The name is `trim()`ed so a
  whitespace-only name falls back.
- Education captions are static: `GPA (optional)`, `Minor (optional)`, `Honors, thesis or other
  details (optional)`; placeholders become examples (`3.8/4.0`, `Mathematics`, `Dean's List,
  thesis title…`) instead of repeating the caption.
- Layout untouched: name `col-span-full` inside `ENTRY_FIELDS_GRID`, title / employer
  `ENTRY_WIDE_FIELD` (R830), e-mail / phone in `REFERENCE_CONTACT_ROW` 4:3 (R832), GPA / Minor
  `grid-cols-2`, Details input + toolbar in the existing flex row with the caption above the
  whole row (R835 description pattern, so the toolbar stays the row's second child). The
  `Reference type` select keeps its `aria-label` (its options are self-describing and it sits in
  the toolbar row).
- Nothing else moves: state keys, preview, PDF / DOCX / TXT / MD, ATS, toolbar buttons and their
  R834 40 × 40 mobile size.
- Rejected: sr-only labels (the complaint is the visible caption); static `Job title` /
  `Employer` (the card is about a third person — `Priya Natarajan's job title` reads as the
  Experience card does); widening Details in the same commit (needs its own evidence-ranked
  design, above).

## Deferred with reasons (not defects claimed fixed)

- **Professional summary**: one textarea directly under the `Summary` section heading; the
  heading is its visible caption. A `<Label>` would duplicate the heading. Kept as is.
- **Custom sections**: the title input *is* the card heading (its value, e.g. `Volunteering`, is
  the visible caption of the entries textarea beneath it); the placeholder `Section title (e.g.
  Volunteering)` shows while blank. A visible `Entries (one per line)` caption is a P2 polish
  item, queued, not claimed.
- **End dates**: the pair caption + `End date` accessible name is the R833 / R835 design;
  unchanged.

## Tests (356 → 361)

- `tests/entry-visible-labels.test.ts` (new `R836` block): the five `ref-*` and three `edu-*`
  label / id pairs; the contextual title / employer template + fallback strings; the Details
  label precedes the input + toolbar flex row; the eight old `aria-label`s are gone.
- `tests/reference-fields-wide.test.ts` (R830) and `tests/reference-contact-row.test.ts` (R832)
  now locate the controls by their stable ids instead of the removed `aria-label`s; the grid
  lookup is the depth-aware `<div` / `</div>` backward scan from R835 (a sibling wrapper made the
  two-token lookbehind pick the name wrapper instead of the grid).
- On the R835 tree the three files fail 9 of 18; pass 18 / 18 here.

## Gates

vitest 361 / 26 files; `tsc -p tsconfig.app.json`, `tsc -b`; eslint 0 errors / 11 pre-existing
warnings; `npm run build`; verify-dist 123 sitemap URLs. `style-CSnCqmMX.css` is unchanged (no
new utility classes); only `index-*` / `Builder-*` change.

## Deploy + native re-measure

New account version `684ebcd0`; production `index-Bg0RChGD.js` / `Builder-BLwjmFjZ.js` /
`style-CSnCqmMX.css` SHA-256-identical to `dist/client/assets`. `r836-native.cjs` on the deployed
bundle (no DOM surgery): 13 / 13 controls per width (two reference cards + education) have a
visible label whose `for` equals the control `id`, 0 `aria-label`s left, 0 duplicate ids,
`scrollWidth === clientWidth` (1009 / 1265 / 360), console 0; inner widths byte-identical to
R835; blank reference card shows the fallbacks `Their job title` / `Where do they work?`. The
audit re-run reads `fields=76 {"visible":64,"srOnly":0,"none":12}` — the 12 left are the
deferred summary / end-date / custom-section controls. Correction: the script's
`refCard` height (302 / 302 / 428) selected the Coursework card (`[id$="-name"]` matched
`cw-*-name` first); the QA machine's 322 / 258 / 434 are the reference-card heights and equal
the simulation exactly.

## Independent production QA (testing agent, `/home/ubuntu/qa/r836-qa/`)

Three independent real Chrome sessions 1024×768 / 1280×800 / 375×667, cache disabled, storage
(localStorage / sessionStorage / cookies / IndexedDB) restored byte for byte, recordings
`r836-{1024,1280,375}-readable.mp4` + `/home/ubuntu/screencasts/r836-*/…-edited.mp4`. **Every
R836 oracle passed**: 13 exact captions per width, `for` = `id`, Chrome accessibility name =
caption, no obsolete `aria-label`, 0 duplicate ids; 39 label clicks focus their control; the
title / employer captions follow the typed name live and fall back on empty and whitespace-only
names; `Reference type` → `Personal reference` persists; layouts as designed (name full row,
title / employer share the 1280 row and stack at 1024 / 375, e-mail / phone 4:3 on desktop, GPA /
Minor paired, Details caption above input + toolbar); all reference values and GPA / Minor fit
(tightest 1024 phone 138.30 px in 149 px); toolbar census 70 controls per width — desktop
22 × 38 × 28 + 48 × 38 × 36, mobile 70 × 40 × 40; tab order name → title → employer → e-mail →
phone → type and GPA → Minor → Details → enabled toolbar; 24 edits input = storage JSON = preview
(`GPA: ` / `Minor in ` prefixes), one Ctrl+Z each byte-exact to the app-written baseline; Hide /
Show and Delete + Undo on a reference at every width; no page overflow with the Education month
picker open (375 panel x 8–232); R826–R835 unchanged (LinkedIn 417 / 545 / 283, Experience full
row at 1024, 12 / 12 dates fit, 12 calendar buttons 40 × 40, 18 R835 + 10 R833 captions); ATS 79
at every width; one PDF (8 459 B, PDF 1.7, two A4 pages, `pdfinfo` valid, all five reference
values + GPA / Minor / full Details in `pdftotext`); axe 0 violations at 1024 / 375; 3 × 50 GET /
0 non-GET / 0 failed / 0 console / 0 page errors (only the automatic read-only
`GET /api/ai/quota`, `freeRemaining: 12`); asset SHAs equal before and after.

Measured geometry (QA machine, no native scrollbar at 375): reference card 322 / 258 / 434 px,
education 432 / 318 / 512 px; 375 usable widths 257 (reference, Details) and 112 (GPA / Minor)
against the native-gutter 242 / 104. Known out-of-scope clipping confirmed unchanged: Details
291.47 px in 161 / 289 / 257 px; the complete value survives storage, preview and PDF.

QA deviations, none a product defect: the Education toolbar census first included the
20 × 17 px entry-audit chip (re-scoped to action buttons); the green `99 · Strong` chip is
resume health, not ATS.

## Boundary

Reference cards grow by 80 / 60 / 100 px and the Education card by 40 / 40 / 40–54 px because
captions are real content. Remaining caption audit items (summary, custom sections, end dates)
are documented above as deferred / by design. **Education Details single-line overflow (64 / 64
corpus values) is the next evidence-ranked Builder item**, ahead of LinkedIn non-English export
and Builder lazy-loading P2.
