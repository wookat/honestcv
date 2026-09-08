# R774 — PDF import rejoins wrapped sidebar items by line pitch (LinkedIn certifications / publications)

## Where this came from

R773 imported the three public LinkedIn "Save to PDF" exports end to end (34 / 34 positions) and
left one thing to the parser it could only half do: the 35-character left column wraps long items,
and `pdfPageText()` emitted every wrapped line as its own line. `parseLinkedInText` rejoined the
shapes it could recognise by text alone (an open quote, a trailing `/` or `-`) and left the rest:

| file     | field          | before (one item per line, as extracted)                                                                                            |
| -------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Giovanni | certifications | `CEH v11: Web Server Hacking,` / `Attacks & Attack Methodologies` / `CEH v11: XSS, Web Shells, APIs &` / `Webhooks` / `CSSLP 2024: Security Design` / `Principles` |
| Kenneth  | certifications | `IBM Certified System Administrator -` / `WebSphere Portal Server v5`, `IBM Certified Lotus Specialist (CLS)` / `R4 - System Administrator`, `Novell - Certified Novell Admin` / `(CNA) v3`, `IBM Certified Lotus Professional -` / `System Administrator` |
| Kenneth  | publications   | `IBM DeveloperWorks tutorial` / `"Managing inbound spam in Lotus Domino 6"` (two bullets for one title)                             |

Giovanni's certifications field read `DevOps Fundamentals; CEH v11: Web Server Hacking,; Attacks &
Attack Methodologies; …` — 8 "certifications" for 5; Kenneth 9 for 5, and 6 publications for 5.

Queue check (R773 handoff): school-followed bare lists, three-zone layouts / sidebar names, LinkedIn
locale variants and `Leadership, Negotiation` rows outside Skills stay queued — none has a real
file in hand beyond a single observed line or a synthetic case; this one shows in two of three real
exports and has a measurable geometric signal, so it ranked first.

## Evidence (geometry, first-hand)

`qa/r774-geo.mts` (not committed) prints every sidebar row of a page with x, width, font size and
the vertical gap to the row above. LinkedIn's column (Apache FOP) is regular:

- headings `Contact` / `Top Skills` / `Certifications` / `Publications` at 13 pt; items at 10.5 pt;
  contact URLs at 11 pt; every row starts at x = 22.
- item → next item: 17–20 pt (1.6–1.9 em of 10.5); line → next line of the same item: 12–13 pt
  (1.14–1.24 em). Kenneth p1: `IBM Certified System Administrator -` 18 above / 12 below;
  `IBM DeveloperWorks tutorial` 18 above, `"Managing inbound spam in Lotus` 12, `Domino 6"` 13 —
  the three lines are one title.
- lists that do not wrap show a single pitch (Bhuvaneshwaran's whole sidebar: 17–20 everywhere;
  Kenneth's Top Skills 17 / 18); the contact block also shows a single pitch (13 between every URL
  row, 12–13 between the wrapped e-mail lines) — text alone cannot tell a wrapped URL from the next
  one there, and the R773 parser rules already handle the e-mail.
- a second segment on the same row (`(LinkedIn)`, `(Blog)`, `(Native or Bilingual)`) has gap 0.

`qa/r774-cols.mts`: the multi-column branch (`pdfPageText` sidebar path) fires on page 1 of all
three exports and on the R763 / R746 controls that already used it (`pages-mac-sumit`,
`synth-sidebar`, `synth-skills-grid`, `canva-3`); nothing new is classified as two-column.

## Decision

`src/lib/extractFile.ts` only, sidebar branch of `pdfPageText()`:

- `Segment` carries the max font `size` of its items (`lineSegments`).
- New `unwrapSidebar(segs)` replaces `inOrder(side)` for the sidebar column only. Rows are walked
  top to bottom in runs of equal font size (±0.25 pt). Within a run the pitch to the row above is
  measured in ems of the row's size; a pitch in (0.5, 1.3] is "tight", ≥ 1.5 is "wide". Only a run
  that shows **both** pitches is treated as a wrapped list; in it, a tight row that starts at the same
  x (±2 pt) as the row above is appended to it (`/`-ending fragments joined without a space, so
  `Lotus Domino/` + `Notes R5` stays `Lotus Domino/Notes R5`). A run with a single pitch (contact
  rows, a skills list, an awards list) is emitted unchanged; a gap-0 second segment on the same row
  is never a wrap.
- Main column, local skills grid and single-column pages untouched.

Rejected: a text rule in the parser (`endsWith(',') / '&' / '-'` — `Certified Scrum Master (CSM)`
and `IBM Certified Lotus Specialist (CLS)` end alike and only one wraps); joining every tight pitch
regardless of the run (over-joined Canva contact rows and Kenneth's URL list in the first draft;
first draft also used a 0.6 pt size tolerance and counted 0 pitch as tight — both fixed after the
geometry dump).

## Local validation

- Extractor replay (`qa/r774-extract.mts`, 72 PDFs = R763 13 + LinkedIn 3 + `alex-morgan` +
  `r771-ox` + R746 54, through pdfjs → `pdfPageText`): **70 / 72 byte-identical** vs the base
  (`0bacf7e`); the two changed files are Giovanni and Kenneth, and every changed line is one of the
  wraps in the table above (diff read line by line — 3 + 4 certifications, 4 publications).
  `canva-3`, `pages-mac-sumit`, `synth-sidebar`, `synth-skills-grid`, all 21 northstar controls,
  Oxford and Alex unchanged.
- Parser on the three exports (`qa/r774-li-compare.mts`): contact, summary, 34 experience tuples,
  9 education rows, skills, Languages / Honors-Awards sections **identical**; certifications
  Giovanni 8 → 5 items, Kenneth 9 → 5, each equal to the item as LinkedIn draws it; Kenneth
  publications 6 → 5 bullets (`IBM DeveloperWorks tutorial "Managing inbound spam in Lotus
  Domino 6"` is one title in the source, R773's count of six was the split). Bhuvaneshwaran
  byte-identical at every stage.
- Retained text corpus (`qa/r768-replay.mts`, 114 texts): 114 / 114 identical to the R773 result
  (`importText.ts` is not touched by this round).
- Gates: `tsc` app + worker, `eslint src/lib/extractFile.ts`, `build`, `verify-dist` green.
  Prettier `--check` warns on this file at base and head alike (the repo has no Prettier config;
  its defaults — semicolons, double quotes — differ from the repo style); the new code follows the
  surrounding style by hand.

## Deployment and production QA

- First deploy `index-DGpXECOL.js` + `extractFile-CMLG4ac0.js` (SHA-256 identical to dist; Routes
  `code 10000` as always). Testing agent, cache disabled, 1280 × 800 + 375 × 667, nine import
  journeys: Bhuvaneshwaran every normalised field equal to R773; Giovanni only `certifications`
  changed, to the five-item string above; Kenneth only certifications + Publications changed
  (5 + 5), all 22 roles / 5 education rows / contact / skills unchanged; dashboard LinkedIn dialog
  → "Open and replace draft" yields the same object as the `/ats-checker` path; controls
  `pages-mac-sumit` (4 roles, 6 skill lines), `synth-sidebar`, `synth-skills-grid`, `canva-3`
  phone `123-456-7890` unchanged; 375 Kenneth editor / preview scrollWidth = clientWidth; 0 console
  errors, 0 HTTP ≥ 400, 0 AI POSTs, 0 paid / download / share / copy operations, storage restored
  byte-for-byte.
- Incidental finding, fixed in this round: the dashboard "Open the imported resume?" dialog
  (`sm:max-w-md`, two footer buttons) overflowed its own box at 1280 (`scrollWidth 474` vs
  `clientWidth 446`, right edge of "Open and replace draft" clipped, horizontal scrollbar) —
  `DialogContent` is a grid whose footer row would not shrink below the two buttons' widths.
  `DialogFooter` gains `sm:flex-wrap` (`src/components/ui/dialog.tsx`); all 31 footers use the
  default `gap-2` classes, so a footer that fits is unchanged and one that does not wraps onto a
  second right-aligned row. Redeployed `index-8IeMkZ69.js` + `extractFile-7KtjHYD7.js` +
  `Dashboard-DGCx02L8.js` + `style-CZ_tZC5P.css` (SHA-256 identical to dist). Re-verified: the
  dialog at 1280 / 660 / 375 has scrollWidth = clientWidth (446 / 446 / 341), both buttons fully
  visible (two rows at ≥ 640, column-reverse at 375); the builder "Load this example?" control
  keeps Cancel + Replace on one row; Kenneth re-import content-identical; 0 errors, storage
  restored.
- Pre-existing, recorded for the queue: `r771-ox.pdf` (the R771-era PDF *export* of the Oxford
  DOCX) parses 7 / 3 at base and head alike — the wrapped detail
  `Crankstart Scholar (widening participation bursary … socio-economic` / `background)` opens a
  bare `background)` education row (extracted text byte-identical before / after; parser
  untouched). Not an R774 regression; a candidate for R775.

## Boundaries

- Measured on LinkedIn's FOP layout and the R763 / R746 controls; a sidebar whose items are set at
  a pitch ≤ 1.3 em with wraps at the same pitch cannot be told apart and stays as extracted.
- Only runs that show both pitches are touched: a wrapped item inside a list whose other items do
  not wrap is left as two lines when the run has fewer than one wide gap (Kenneth's contact block —
  the R773 parser e-mail rule still applies).
- Sidebar column only; the main column keeps pdfjs order and the parser's continuation rules.
- Pasted text is not affected (this is PDF extraction).
