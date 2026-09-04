# R375 — Don't score vacuously-passing ATS structure checks

## Evidence (first-hand)

Local probe on `emptyResume()` with no JD (`.tmp-smoke/r375_probe.ts` against main):

```
score 63 structure 63
```

15 of 24 structure checks PASS on a resume with **zero content**: "Employment dates
listed" (`[].every` is vacuously true), reverse-chron / 3–6 bullets / date format /
named months / locations (no entries → no offender), pronoun / active voice / weak
openers / punctuated / bullet length / buzzwords / fillers (no text → no match),
"Skills grouped into categories" (blank skills < 8 items), "Fits the recommended
page count" (unknown page count counted as pass).

So a brand-new empty draft shows **63/100 "Almost ready"** (R226 readiness tier is
`almost` at ≥50). Rezi scores an empty resume near zero. Recorded as a P3
observation in R373; this is the R375 round.

## Root cause

Every check factory returns `pass: true` when its input collection is empty, and
`finalize()` scores `passed / total` over all 24 checks. Quality checks over
content that does not exist are not evidence of quality.

## Fix (deterministic, read-side of scoring only)

- Add optional `na?: boolean` to the check shape: a check is **not applicable**
  when it had no content to inspect.
- Factories set `na: true` when their input is empty:
  - `reverseChronCheck`, `bulletsPerEntryCheck`, `entryLocationsCheck`: no entries
  - `dateFormatCheck`, `namedMonthDatesCheck`: no non-blank dates
  - `pronounCheck`, `buzzwordCheck`, `fillerWordCheck`: all segments blank
  - `activeVoiceCheck`, `weakOpenerCheck`, `quantifiedBulletsCheck`,
    `punctuatedBulletsCheck`, `bulletLengthCheck`: no non-blank lines
  - `pageLengthCheck`: page count unknown (`pages == null || pages < 1`)
  - inline in `scoreResume`: "Employment dates listed" (no named experience
    entries), "Skills grouped into categories" (blank skills)
- `finalize()` drops `na` checks **before** computing the structure ratio and
  before returning, so every consumer (score math, category rows, checklist
  counts, guidance weights, readiness blockers, assistant summary, Fixed chips)
  sees only applicable checks with no UI changes.

Always-applicable checks (contact, summary, experience-with-bullets, quantified
achievements simple check, skills filled, education, word count, LinkedIn) keep
the denominator non-zero.

## Acceptance

- Empty resume, no JD: score ≤ ~13 (1/8-ish), readiness tier `not-yet`.
- A full resume where every check applies: score byte-identical to main.
- Text checker (`scoreResumeText`) inherits the same semantics via shared factories.
- Oracle covers: empty resume low score, full-resume identity, partial resume
  (bullets but no dates) drops only date-ish checks, checker text path.
- tsc / eslint / build green; production QA: fresh draft shows honest low score,
  wizard/sample flows regress clean, 375 light/dark strict.
