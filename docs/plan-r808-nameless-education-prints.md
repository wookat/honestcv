# R808 — an education entry with no degree or school still prints

## Benchmark refresh (function-oriented, 5 rounds since R803)

`/home/ubuntu/qa/r808-rezi.mjs` (same loop as R799 / R803): Rezi home, AI
resume builder, pricing, redirected resume checker / job search / cover-letter
builder / interview pages all 200, `/resume-keyword-scanner` still 404; the
8-page JSON (status / final URL / byte count / title / headings) is identical
to `r803-rezi.json`.
Production: `/`, `/builder`, `/ats-checker`, `/jobs`, `/dashboard`,
`/documents`, `/examples/` 200, `/pricing` 307; `/api/jobs/search?q=engineer`
150 rows (Arbeitnow 89 · Jobicy 50 · Remotive 11), 0 descriptions with raw
markup. No new public P0. The P1 is the finding R807 production QA left
open: stored data that never prints.

## Source

R807 production QA (shape H) and the word-table corpus replay: an education
entry that has dates and a detail line but no degree and no school

```
EDUCATION
2017 – Jun 2020
First Class Honours. Final project: a journey planner.
```

is stored and editable in the Builder (degree / school placeholders, dates,
details) but **omitted** from the preview, PDF, DOCX, TXT, Markdown and the ATS
"Education listed" check. Every renderer and the scorer go through one helper:

```ts
// R772
export const educationEntries = (r: Resume): EducationItem[] =>
  r.education.filter((e) => e.degree.trim() || e.school.trim())
```

Before R807 the same paste printed `2017 · Jun 2020` as degree / school text;
R807 stored it faithfully and thereby made it invisible. The same happens to any
row the user fills only with dates, details, minor or GPA.

Evidence (`qa/r808-evidence.mts`, this branch before the fix):

```
stored education: [["","","2017","Jun 2020","First Class Honours. Final project: a journey planner."]]
educationEntries(): 0
TXT has EDUCATION heading: false | honours text: false
MD  has Education heading: false | honours text: false
PDF has EDUCATION: false | honours text: false
DOCX has EDUCATION: false | honours text: false
ATS check: Education listed → false
corpus 186 texts, nameless dated/detailed education entries in 2
  pdf:qa/r746/word-table.pdf / text:qa/r746/word-table.pdfjs.txt
```

After the fix every line reads `true` / `1` (`/home/ubuntu/qa/r808-after.out`).

## Fix (narrow, shared helpers only)

`src/lib/resume.ts`

```ts
export const educationEntries = (r: Resume): EducationItem[] =>
  r.education.filter(
    (e) => e.degree.trim() || e.school.trim() || e.startDate.trim() || e.endDate.trim() || educationDetailLine(e)
  )
/** Date range printed for an education entry */
export const educationDates = (e: EducationItem): string =>
  [e.startDate.trim(), e.endDate.trim()].filter(Boolean).join(' – ')
```

Renderers handle an empty heading instead of inventing one:

- TXT: `degree, school, location (dates)` when there is a head; the bare date
  range as the line when there is none; details on the next line. No empty
  line is emitted for a details-only row.
- Markdown: `### head *(dates)*` / `### dates` / no heading for a details-only
  row (previously `### ` was always emitted).
- PDF (`src/lib/pdf.ts`): `entryHeader(head, dates)` when either exists; a
  details-only row gets the entry rule + gap and its body text.
- DOCX (`src/lib/docx.ts`): heading paragraph only when head or dates exist;
  a details-only row carries the entry border on its body paragraph.
- Preview (`src/components/ResumePreview.tsx`): the heading / date row renders
  when editable or when degree / school / location / dates exist, so a
  read-only details-only row prints just its details — no `Degree`
  placeholder, no empty bold row, no dangling `·`. Editor mode keeps the
  click-to-type placeholders.
- ATS (`src/lib/ats.ts`): "Education listed" follows the helper; the location
  check's anchor name falls back to the detail line / dates so a nameless entry
  never produces an empty name. No other scoring change.

Not included on purpose: a location-only row (no evidence; the Builder cannot
produce it without a degree / school in practice) and the completely blank
placeholder row the Builder adds — it must stay unprinted.

## Rejected

- Printing the dates as degree / school text (the pre-R807 behaviour) — lies
  about the field the user filled and re-imports as a degree named `2017`.
- Fixing only the preview — the same helper feeds five outputs and the scorer;
  the parity tests (TXT = MD = PDF = DOCX = ATS) are the point.
- Teaching the parser to invent a school from the surrounding text — R807
  deliberately left the entry nameless; the fix belongs downstream.

## Old / new proof

- New suite `tests/education.test.ts` (229 → 235): shared predicate incl. the
  all-blank row; TXT / MD line order and no empty heading; our own TXT / MD of
  the nameless entry re-imports as `['', '', '2017', 'Jun 2020', honours]`;
  read-only preview via `renderToStaticMarkup` (section present, no `Degree`
  placeholder, no empty bold `<p>`), editor keeps the placeholder; PDF text
  (pdf.js) and DOCX (`extractResumeFile`) for six shapes + blank row; ATS
  "Education listed" pass / fail. On the frozen R807 checkout
  (`git worktree` at HEAD, `/home/ubuntu/qa/r808-wt`) **all 6 tests fail**
  (`expected [] to have a length of 1`, `… to contain '\nEDUCATION\n'`,
  `expected false to be true`).
- Parser untouched: 186-file replay (`qa/r808-replay.mts`) parse output
  **186 / 186 identical** to the R807 checkout; `educationEntries()` / TXT
  differ for exactly the 2 corpus texts that carry the nameless entry
  (`qa/r746/word-table.pdf` + pdf.js twin) — they gain `EDUCATION /
  2017 – Jun 2020 / First Class Honours. Final project: an accessible public
  transport journey planner.`
- Goldens unchanged; gates `tsc -b` / `eslint .` (0 errors, 11 pre-existing
  warnings in untouched files) / vitest 235 / build / verify-dist (123 sitemap
  URLs) green.
- Second pass (same round, after the first production QA): the education school
  `InlineText` gets `placeholder="School"` and the heading row renders only when
  editable or a degree / school / location / date exists, so in edit mode both
  sides of the ` · ` are a typed value or a click-to-type placeholder (`Degree ·
  School`, `BS Computer Science · School`, `Degree · State University, Austin,
  TX`); `Tail` itself is unchanged and experience / other sections are out of
  scope. Two more tests (editable-heading text per shape + `eduBlock`-scoped
  read-only checks, no `·</span>`): vitest 236; replay re-run `parse identical
  186/186; educationEntries changed 2; TXT changed 2`.

## Deploy + production QA

- `npm run build && node scripts/verify-dist.mjs && wrangler deploy`: 30/30
  assets + worker uploaded; route listing still `Authentication error [code:
  10000]` (token lacks the route-list permission, not redeployed for it).
  Cache-disabled production `index-DVpLZKZt.js`, `ResumePreview-C7Ui5thJ.js`,
  `pdf-0cHj5Dt_.js`, `docx-D5O5HA7V.js`, `ats-CjKZm1nv.js`,
  `Builder-DhO83HQh.js`, `AtsChecker-Cf56-DTN.js`, `importText-DZ0mc8ki.js`,
  `extractFile-BFzJBZLp.js` (10 chunks) SHA = local dist, before and after QA.
- Persistent testing agent, 1280 + independent 375, recording 6m25s
  `/home/ubuntu/qa/r808/r808-production-readable-2x.mp4`: A (R807 H shape) via
  Builder Import paste and ATS paste → Replace at both widths — one stored card
  `['', '', '2017', 'Jun 2020', honours]`, preview prints EDUCATION /
  `2017 – Jun 2020` / honours, Builder "Education listed ✓"; B details-only
  (`Dean's List 2019`) printed + ✓; C end-date-only `2021` printed + ✓; D
  degree-only / school-only print (R772), one blank row (and the import's
  blank scaffold) prints no section and "Education listed ✗"; minor-only
  (`Minor in Mathematics`), GPA-only, start-only print and count; F corpus
  `qa/r746/word-table.pdf` uploaded to `/ats-checker` → Builder: exactly one
  stored row `['', '', '2017', 'Jun 2020', honours]`, degree / school
  `:placeholder-shown`, EDUCATION / `2017 – Jun 2020` / the full honours
  sentence printed, no empty-sided separator, "Education listed ✓"; regressions Sumit
  82/22 4/1/4 `Technical Writing`, Oxford 82/22 7/2/0, Alex 95/22 2/1,
  Kenneth 55/22 22/5 unchanged (fixture hashes = R807); 375 width = 375, no
  overflow; 1,207 GET / 0 POST (32 quota reads), 0 console / page errors,
  0 HTTP ≥ 400, 0 AI / lead / share / pay / copy / delete / download;
  28 byte-exact storage checkpoints (immediate + settled) + final / all-tabs
  snapshots. 496 / 501 raw assertions; 3 failures are comparator-side
  (expected `Minor: Mathematics`, product prints `Minor in Mathematics`;
  Sumit whole-object compare included the random `custom:<id>` in
  sectionOrder — content compare passed; a one-row mobile control compared to
  a two-row desktop case), 2 were the editor `Degree ·` finding (B at 1280 and
  375) — fixed by the second pass below and redeployed (`index-5x_XhBBY.js`,
  `ResumePreview-jF05NXm6.js`, `Builder-Ds7Myz29.js`, `AtsChecker-tQ32agn7.js`,
  `pdf-7rk-oVIb.js`, `docx-DakW6hYm.js`, `ats-BugjDYjz.js`,
  `importText-CIDi7lvE.js` SHA = local dist).
- Second production pass (editor separator): see handoff-context R808 entry for
  the run result.
- Standalone `/ats-checker` has no "Education listed" row (text checks only);
  the structured check lives in the Builder after "Fix it in the builder /
  Replace" — verified there.

## Boundaries (recorded, not fixed)

- **Editor preview** of an experience / involvement / coursework / certification
  / award / publication / military row with an empty right-hand side still
  shows `Role ·` followed by an empty click-to-type span — those `InlineText`s
  have no placeholder (editor convention since R771 / R772; read-only preview
  and exports omit the separator). Education is fixed this round; the other
  sections are queued (same one-line placeholder each).
- A row with only a location is still not an entry.
- Exports / downloads were not exercised in production this round (covered by
  the PDF / DOCX unit tests); read-only shared preview not exercised (sharing
  is out of the QA protocol; covered by the `renderToStaticMarkup` test).
