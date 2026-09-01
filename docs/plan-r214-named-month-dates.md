# R214 — "Dates use a written month" ATS check (builder + checker)

## First-party evidence

Rezi user guide "Using the Rezi Score"
(https://intercom.help/rezihelp/en/articles/8383527-using-the-rezi-score),
Best Practices audits:

> "Date format - List dates in a written month format (January 2023) to
> quickly grasp your timeline of experience and enhance readability."

## Gap

R210 added "Consistent date formatting", which fails only when named-month
and numeric styles are *mixed*. A resume that uses numeric dates everywhere
(08/2021 – 03/2023) passes today, yet Rezi's audit explicitly asks for the
written month format. Nothing in either scoring path nudges numeric dates
toward named months.

## Design

New structure check `Dates use a written month`, reusing the R210 `dateStyle`
classifier (`month-year` | `numeric` | null).

- `namedMonthDatesCheck(dates: string[])`: fails when any date classifies as
  `numeric`; the hint quotes the first offender and suggests the written form
  (e.g. `"08/2021" → "Aug 2021"`). Bare years, Present/ongoing, blanks and
  unparseable text are skipped (null style) — never a false alarm; year-only
  education dates stay legal.
- Builder: visible experience + education `startDate`/`endDate` (same feed as
  the R210 check).
- Checker: `textDateRanges(raw)` halves (Experience block only, same feed as
  R210). No heading / no ranges → no dates → pass (guard).
- Anchor `experience`; flows into R176/R203 Priority fixes and the R204
  "Fix in builder →" deep link like every structure check.
- Month-name → suggestion mapping: numeric month 1–12 → Jan…Dec; invalid
  month (e.g. 13/2021 won't match NUMERIC_DATE_RE's \d{1,2} with value >12 —
  it still matches; guard by clamping: if month not in 1–12, suggest generic
  "a written month like Jan 2021").
- Denominators: checker structure rows 14→15, Builder breakdown 15→16.
  Scoring formula unchanged. Only `src/lib/ats.ts`.

Relationship to R210: orthogonal — R210 fails only on mixes; R214 fails on
any numeric date. A mixed resume fails both (each names its own evidence).

## Acceptance

- Builder: all named-month sample resume passes (16 rows); switching one
  experience start to `08/2021` fails with hint quoting `"08/2021"` and
  suggesting `"Aug 2021"`; Fix → lands on Experience; hidden entries ignored.
- Checker: `Jun 2020 – Present` passes; `08/2021 - 03/2023` fails quoting
  the offender; bare-year ranges (2019 - 2021) pass; no-heading guard passes;
  15 structure rows; no-JD score = round(passed/15·100), fixes +100/15 ≈ +6.7.
- 375px, dark mode, R213/R212/R210 regressions unchanged.
