# R804 — a lone year under an education entry is its graduation year, not a second entry

## Source

R803 production QA (Builder Import paste and ATS paste → Replace, both
widths): 305 assertions passed, 9 failed; every failure reproduced on the R802
parser and the one that is a product defect is this one — `EDUCATION` /
`BS Computer Science · State University` / `2016` stored **two** education
rows, the second with `degree = '2016'` and nothing else. The Builder shows an
extra education card whose degree field reads `2016`; every template prints
it; `/ats-checker` counts it as an entry.

Evidence (`qa/r804-evidence.mts`, R803 parser):

| shape | R803 | expected |
| --- | --- | --- |
| `Degree · School` / `2016` | `[Degree, School, '', '']`, `['2016', '', '', '']` | one row, `2016 – 2016` |
| `School` / `Degree` / `2016` | same second row | one row |
| two entries each followed by a year | 4 rows | 2 rows |
| `Degree · School` / `2016` / `GPA: 3.8` | GPA on the `2016` row | GPA on the entry |
| `Degree · School` / `2012 – 2016` | correct (existing `!rest && start` branch) | — |
| `Degree · School` / `May 2016` | correct | — |
| `Degree · School (2016)` | correct (inline `(YYYY)`, R787) | — |
| experience `Role · Company` / `2016` | correct — the experience branch already has a `BARE_YEAR_LINE_RE` rule | — |

Where the shape comes from (`qa/_r804pdf2.mts`, `qa/_r804docx.mts`): our own
**PDF (all 25 templates) and DOCX** exports print an education entry whose
`startDate` is empty and `endDate` is `2016` — the common "graduation year
only" case the Builder allows — as a bare `2016` on its own dates line. TXT
and Markdown print the date inline (`Degree, School (2016)`) and already round
trip. `extractDates` does not read a lone `YYYY` as a date (by design: a lone
four-digit number is ambiguous outside a dates line), so the education branch
fell through to "new entry".

Retained corpus (`qa/r804-corpus.mts`, 186 texts): 0 files with a year-only
degree — the defect is in our own round trip, not the corpus; Kenneth's
LinkedIn certifications (`CSP` / `2014`) already parse as single-year entries
through the LinkedIn path and are unaffected.

## Options considered

- **Teach `extractDates` a lone `YYYY`** — global: every `2008` in a bullet,
  a project line or an address becomes a date. Rejected.
- **Print a range in the exports (`2016 – 2016`)** — only fixes our own
  files, prints a nonsensical range for the reader. Rejected.
- **Mirror the experience rule in the education branch** (chosen): a line
  matching the existing `BARE_YEAR_LINE_RE` while the current education entry
  has a degree or school and no dates yet becomes `startDate = endDate =
  YYYY` — the same representation the experience branch and the inline
  `(YYYY)` reading already store.

## Implementation (`src/lib/importText.ts`, `case 'education'`)

```ts
const year = line.trim().match(BARE_YEAR_LINE_RE)
if (isBullet(line) && currentEdu) { …unchanged… }
else if (year && currentEdu && (currentEdu.degree || currentEdu.school) && !currentEdu.startDate && !currentEdu.endDate) {
  currentEdu.startDate = year[1]
  currentEdu.endDate = year[1]
} else if (!rest && start && currentEdu && !currentEdu.startDate) { …unchanged… }
```

Nothing else changes: ranges, month/year lines, inline dates, detail lines,
the school-first layout and the experience branch keep their existing paths.

## Proof

- `tests/import/rules.test.ts` +1 (R804): the three defect shapes above plus
  GPA attachment, the range / month / inline controls, and "an entry that
  already has dates does not take a later year". Fails on the R803 parser
  (`expected [ {…}, { degree: '2016', … } ] to deeply equal [ {…} ]`).
- `tests/pdf.test.ts` +1: an education entry with `endDate = '2021'` and no
  `startDate` re-imports as one dated entry from **every one of the 25
  templates**. Fails on the R803 parser (`classic: expected [ …(2) ]`).
- DOCX: same shape (`qa/_r804docx.mts`) — R803 `[Degree, School, '', ''],
  ['2021', '', '', '']`, R804 `[Degree, School, '2021', '2021']`.
- 186-file replay vs the R803 byte copy (`qa/r804-parse-replay.mts`):
  **184 identical, 2 changed** — `canva-3.pdf` and its pdf.js text twin,
  `education` only. Read in full: the source is the interleaved two-column
  Canva placeholder extraction (`Provide support to project managers in
  planning, monitoring,` / `2008` / `and executing projects` / `Enter Your
  Degree` / …). Before, the `2008` opened a row with `degree = '2008'`; now it
  dates the placeholder row above it (`Enter Your Degree ·
  University/College/High School 2008 – 2008`) and the following fragments
  regroup accordingly (PDF 6 rows → 5, text 9 → 8). Neither reading is the
  document — it is template placeholder text, recorded as unreadable since
  R802 — and no real content is lost or gained. No narrower guard would keep
  this file byte-identical without also rejecting legitimate entries whose
  header is not a recognised degree word, so the change is accepted.
- Goldens unchanged; `npm test` 224 → 226; tsc ×3 / eslint / build /
  verify-dist green.

## Boundaries

- A year line **above** its entry (`2018` / `MS Data Science · Tech
  Institute`) still opens a row with `degree = '2018'` — and the experience
  branch stores `Role · Company` as the role with `2018` as the company for
  the same layout. Pre-existing, both sections, no corpus hit; queued.
- A second lone year after an already-dated entry still opens a new row
  (existing behaviour; asserted only that the dated entry is untouched).
- A lone year is only read as a date when an entry with a degree or school is
  open; under a bare `EDUCATION` heading it keeps its existing treatment.
