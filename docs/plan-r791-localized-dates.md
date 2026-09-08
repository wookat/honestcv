# R791 — dates written in the product languages are dates everywhere

Origin: boundary carried since R789 / R790 — "localized date words (`ene. 2022 –
actualidad`) are still not date ranges". The product lets a resume be written in
ES / FR / DE / PT (`ResumeLanguage`), localizes its section headings (R789 / R790), but
every date path was English: the picker offered English months and `Present`, the
exports printed `Present` on a Spanish resume, the importer and the `/ats-checker`
scorer read English month stems and English ongoing words only.

## Evidence (`qa/r791-dates.mts`, `qa/r791-before-after.mts`, `qa/r791-order.mts`)

Controlled fixtures — `sampleResume()` in each language with dates typed the way a
speaker would (`ago. 2023 – Actualidad`, `août 2023 – Aujourd'hui`, `Aug. 2023 – Heute`,
`set. 2023 – Atual`) — measured on the R790 code (`src/lib/_r790_*.ts`, byte copies of the
R790 modules) and on this branch:

| path | R790 | R791 |
| --- | --- | --- |
| TXT / MD / PDF / DOCX / preview of an ES / FR / DE / PT resume with a blank end date | `… – Present` in every language | `… – Actualidad` / `Aujourd'hui` / `Heute` / `Atual` |
| Builder date picker (`MonthYearField`) | English months + `Present` on every resume | months and ongoing word of the resume language |
| importer, our own TXT / MD export with localized dates | **1 experience**, header `Software Engineer \| Brightlane, Austin, TX (ago. 2023 – Actualidad)`, dates empty — the date range was not recognised, so the header was not a header and the second role was swallowed (ES / FR / DE / PT alike) | 2 / 2 roles, dates and locations equal to the source |
| `/ats-checker` text score, FR dates | 94, **17 checks** — no range matched (`août`, `févr.` fail `[a-z]{3,9}`), the five experience-block checks did not run | 95, 22 checks |
| `/ats-checker` text score, ES / DE / PT dates | 95, 22 checks — but only the *closed* range (`ene. 2021 – abr. 2023`) was read; the ongoing role was invisible: an ongoing role listed after an older one **passed** reverse-chronological order (English fails it) | fails it, like English |
| `dateSortValue('ago. 2023')` / `août 2023` / `set. 2023` | 24282 for all three — month word unknown, falls back to mid-year (June) | 24284 / 24284 / 24285 = `Aug` / `Aug` / `Sep 2023` |

The Builder score (`scoreResume`, structured fields) already reached the right
reverse-chronological verdict on these fixtures (ongoing detection fails open to the
start-date comparison), so no Builder score changes.

## Change

One vocabulary, owned by `src/lib/resume.ts`, consumed everywhere:

- `DATE_WORDS[lang]` — the 12 short month words the picker offers and the ongoing word
  (`Actualidad` / `Aujourd'hui` / `Heute` / `Atual`, English `Present`);
  `MONTH_NAMES_I18N` full month names; `MONTH_VARIANTS` for the alternative
  abbreviations browsers print (`sep`, `set`, `setiembre`, `mär`). `monthIndexOf()`,
  `MONTH_WORD_ALTERNATION` (accented and accent-stripped forms, trailing period
  optional), `ONGOING_WORDS` / `ONGOING_WORD_ALTERNATION`, `ONGOING_RE` (whole string).
- `dateSortValue()` uses `monthIndexOf()`; `experienceDateRange(start, end, language)`
  prints `DATE_WORDS[language].present` for a blank end date. `resumeToPlainText` /
  `resumeToMarkdown` / `docx.ts` / `pdf.ts` / `ResumePreview.tsx` pass
  `resumeLanguageOf(resume)`.
- `src/lib/importText.ts`: `MONTH` = English stems + `MONTH_WORD_ALTERNATION`;
  `DATE_RANGE_RE` end accepts `ONGOING_WORD_ALTERNATION`; `SINGLE_DATE_RE` /
  `BARE_MONTH_RE` share `MONTH`. Nothing else in the parser moves.
- `src/lib/ats.ts`: `DATE_RANGE_RE` / `MONTH_YEAR_RE` become Unicode-aware
  (`\p{L}{3,10}`, `u` flag) and the range end accepts `ONGOING_WORD_ALTERNATION`.
  Weights, keyword / requirement extraction, boilerplate and employer filters untouched.
- `src/components/MonthYearField.tsx` gets `language?: ResumeLanguage` (default `en`) and
  renders `DATE_WORDS[language]`; the 10 call sites in `Builder.tsx` pass
  `resumeLanguageOf(resume)`. Chrome labels of the picker (`year only`, `Previous year`,
  `Clear`, aria labels) stay English — only stored date *values* were in scope.
  Production QA found the popover opening below the 375 × 667 viewport (ongoing button at
  y 780, reachable only after scrolling — pre-existing placement); the popover now calls
  `scrollIntoView({ block: 'nearest' })` on open, which the existing
  `scroll-padding-bottom` for the mobile pane switcher keeps clear of the switcher.

`ONGOING_RE` is only ever applied to end-date fields (Builder, letterExamples, resume
sort, ats date parsing), never to prose, so `actual` / `now` in a bullet cannot match.

Rejected: per-language date tables in ats / importText (one source of truth instead);
translating the picker's chrome / hints (UI i18n is a different item); `Intl`-generated
month lists at runtime (the stored strings must stay stable across browsers).

## Tests (`npm test` 160 → 179)

- `tests/resume.test.ts` (new): every picker month word and full month name → its month;
  `dateSortValue` of `ago.` / `août` / `Aug.` / `agosto` / `August` = `Aug 2023`;
  `ONGOING_RE` true for every language's words, false for `Presenter` / `Actualización` /
  `Heuteland` / dates; blank end date prints the language's word in TXT / MD, English keeps
  `Present`.
- `tests/import/rules.test.ts` + 3: our own TXT + MD export with localized dates
  re-imports both roles with role / company / location / dates equal (ES / FR / DE / PT);
  full month names, `to` ranges, `Dez. 2023` one-off, bare `setembro 2017` line; guard —
  `agosto` / `Mai 2020` inside bullets are not dates.
- `tests/ats.test.ts` + 3 (`it.each`): 22 checks run on ES / FR / DE / PT dates;
  an ongoing role listed after an older one fails reverse-chronological order in every
  language, like English; a numeric `03/2023` beside `ene. 2021` is still the one flagged.

On the R790 modules, 9 of the 19 new cases fail (4 importer round-trips, the multi-form
importer case, 4 reverse-chronological cases); the `tests/resume.test.ts` cases use
exports that did not exist in R790.

## Replay (`qa/r791-ats-replay.mts`, `qa/r791-parse-replay.mts`)

R790 scorer vs branch, 186 retained texts (114 + 72 PDF texts), no JD: **186 / 186
identical**. R790 parser vs branch, same 186: **186 / 186 identical**. The new forms
occur only in resumes written in the four languages; no retained real-world CV carries
one.

## Boundaries

- Picker chrome and every other Builder / ATS string remain English (only the stored
  month / ongoing values are localized).
- Vocabulary = the words the product itself prints plus the browser `Intl` short-form
  variants; regional variants such as `sept.` vs `set.` are both known, other spellings
  (`Sommer 2021`, `Q3 2022`) are not dates in any language, as before.
- `MONTH_YEAR_RE` / `DATE_RANGE_RE` accept any 3–10-letter word before a year in the ATS
  scorer (as the English version accepted any `[a-z]{3,9}`); the month itself is not
  validated there, unchanged behaviour.
- English-only content checks (pronouns, buzzwords, filler, weak openers, passive voice)
  still pass trivially on non-English prose (R790 boundary).

## Production QA (testing agent, `/home/ubuntu/qa/r791/`)

Deployed `index-9ORJBQoQ.js` + `ats-CS_YD2D6.js` + `importText-BDYd24ug.js` +
`Builder-BN0a1Zhh.js`, then `index-DvC-Yh1r.js` + `Builder-BB4PlvT7.js` for the picker
follow-up (SHA-256 identical to dist, `assets.txt`); Routes `code 10000` as always.
1280 + independent 375, cache disabled, 34 + 2 fresh-tab journeys, 45 ATS scans, 2
authorized downloads:

- ES / FR / DE / PT dates fixtures, TXT + MD paste at both widths + ES TXT upload: **95 / 95 /
  – / 22** without JD, **99 / 95 / 100 / 22** with the short JD, check list (labels, states,
  rendered hints) identical to the EN sample and the R790 baseline; all four misordered
  fixtures **91 / 22** failing exactly word count + reverse-chronological order.
- Builder Import ES upload / FR paste / independent 375 ES upload: 2 / 1, stored dates exactly
  `ago. 2023 → Actualidad`, `ene. 2021 → abr. 2023` (FR `août 2023 → Aujourd'hui`,
  `févr. 2021 → déc. 2022`), locations, 216-char summary, 81-char skills; mobile = desktop.
- Picker: ES month list + `Actualidad`, FR + `Aujourd'hui`, EN + `Present`; ongoing click
  stores the word (input, state, preview); March → `mar. 2024`; chrome English; Builder panel
  92 in ES / FR / EN with identical text.
- Blank end date, ES: preview + one TXT + one PDF (pdftotext) contain `– Actualidad`, no
  `Present`.
- Guards: `agosto` / `"Mai 2020"` bullets stay two bullets under one role dated 2019 – 2021;
  full-month / `to` / one-off probes give the four expected pairs; Sort by date moves the
  ongoing role first.
- Regression vs R790: Oxford 82 7 / 2 / 0 (`Dec 2023` once, literal `A*`, 0 `<em>`), Sumit
  PDF / DOCX 82 4 / 1 / 4 (3 / 3 / 3 / 2), Alex 95 2 / 1, sample Modern PDF 95 2 / 1 — fields
  and check lists identical.
- **Failed, then fixed**: at 375 × 667 the end-date popover opened at y 568–825, ongoing button
  below the viewport (reachable by scrolling; no overflow). After the `scrollIntoView`
  follow-up: popover y 330–587 above the pane switcher (y 606) with no manual scroll, all 16
  buttons hit-testable; reopening does not scroll; desktop `scrollY` unchanged when the
  picker is already visible.
- 375 / 375 no overflow on every mobile path; 0 console / page errors, 0 failed requests,
  0 HTTP ≥ 400, 0 POSTs, 0 leads / shares / payments / copies / deletes; storage byte-equal at
  all 35 (+ follow-up) checkpoints (`cleanup.json`, `cleanup-2.json`).
- Untested: FR / DE / PT blank-end exports (TXT / PDF read for ES only; unit-tested), DOCX / MD
  downloads with localized dates, other picker fields, physical devices / other browsers.
  Recordings `/home/ubuntu/screencasts/r791-localized-dates/…-edited.mp4`,
  `/home/ubuntu/screencasts/r791-picker-followup/…-edited.mp4`; structured `results.json`,
  `results-2.json`.
