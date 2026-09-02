# R210: consistent date formatting ATS check

## Evidence (Rezi public first-party surface)

- Rezi public checker page (rezi.ai/tools/resume-checker): "Key improvements include
  integrating quantified achievements, resolving grammatical issues, eliminating
  buzzwords, and applying standard date formatting." The same page counts date
  formatting among its "23 critical ATS checkpoints".
- Rezi User Docs Rezi-Score guidance repeatedly frames dates as parser inputs
  (ATS builds the work timeline from them).

## Current HonestCV gap

Dates are free text. `dateSortValue` parses "Jun 2023", "08/2021" and "2019"
equally, so a resume can mix "Jun 2023 – Present" with "08/2019 - 05/2021"
across entries. Nothing in the Builder score breakdown, the checker, or
`resumeHealth` (tense/placeholder consistency only) flags mixed date styles —
one of Rezi's named checkpoints.

## Design

New structure check `Consistent date formatting` (anchor `experience`) in both
scoring paths in `src/lib/ats.ts`, same shape as R208/R209.

### Style classifier `dateStyle(text)`

- ongoing words (`ONGOING_RE`) or blank → null (skipped)
- `Mon(th) YYYY` (named month + year) → `month-year` (e.g. "Jun 2023")
- `MM/YYYY`, `MM.YYYY`, `MM-YYYY` → `numeric` (e.g. "08/2021")
- bare `YYYY` → skipped (years-only education/experience is a common, benign
  style and legitimately coexists with monthful styles)
- anything else → null (skipped; unparseable text is not evidence of mixing)

### Check `dateFormatCheck(dates: string[])`

- Fail only when both `month-year` and `numeric` styles appear — an
  unambiguous mix. First example of each style is quoted in the hint:
  `Dates mix formats ("Jun 2023" vs "08/2021") — pick one style so ATS parsers
  read your timeline consistently.`
- Fewer than two classified dates, or a single style → pass.

### Builder path (`scoreResume`)

Visible (`!hidden`) experience + education entries' `startDate`/`endDate`.

### Checker text path (`scoreResumeText`)

`textDateRanges` (R208) start/end strings of the experience block.

## Non-goals / invariants

- No scoring-formula change (denominators shift by design: checker 10→11,
  Builder 11→12); zero AI / API / schema / persistence changes.
- Joins priority fixes + R204 deep links via `anchor: 'experience'`.
- No auto-editing; the R124 month/year picker already produces "Mon YYYY".

## Acceptance

- Builder: all "Mon YYYY" passes; changing one entry to "08/2021" fails quoting
  both styles; years-only education does not trigger; hidden entries ignored.
- Checker: "Jun 2020 - Present" + "08/2017 - 05/2019" fails; uniform styles
  pass; "2019 - 2021" (bare years) never triggers.
- Lint/typecheck/build green; production QA 1440+375 + dark; R208/R209
  regressions green.
