# R331 — JD keyword extraction: close the stopword inflection gaps

## Evidence (first-hand)

R328's SOP-10 audit flagged that /jobs tailoring-report chips still show
generic words. Probe (`.tmp-smoke/r331_probe.ts`) against `matchReport` with a
realistic JD confirms: `used` and `daily` come out as extracted keywords —
they are listed as "missing keywords" the user should add to their resume,
which no keyword scanner (Rezi's included) would advise.

Root cause is not a missing design: `STOPWORDS` in `ats.ts` already excludes
this vocabulary by intent — it has `use using`, `day days`, `work working`,
`help`, `seek seeking`, `offer offers offering`, `required requirements` — but
misses common inflections (`used`, `uses`, `daily`, `worked`, `works`,
`helped`…). R325 had to re-filter some of these downstream
(`GENERIC_JD_WORDS` in `interviewAnalysis.ts`) precisely because extraction
leaked them.

Title words (`senior`, `engineer`) are NOT touched: matching the job title in
a resume is legitimate ATS advice (unlike spoken interview answers, where R325
filters them — that boundary stays).

## Change (ats.ts STOPWORDS only)

Add the missed inflections of words already on the list:
`used uses worked works daily weekly monthly helps helping helped offered
require requires requirement skill year jobs roles positions companies
experiences seeks sought`.

Deliberately NOT added: `teams` (Microsoft Teams is a real product keyword).

Effects propagate consistently to every consumer of `extractKeywords` — match
score denominator, /jobs report chips, builder keyword triage, assistant
guidance, JD highlighting, interview coach — all stop treating filler
inflections as keywords. Scores can shift slightly (denominator shrinks);
that is the point: the previous denominator counted words nobody should add.

## QA (production)

/jobs tailoring report on a JD containing "used … daily": chips no longer
include them, title words still present where the JD title has them;
/ats-checker score recomputes without filler keywords (keyword list in report
free of the added words); builder Target-job panel regression; 375 strict,
dark mode, zero AI, baseline restore.
