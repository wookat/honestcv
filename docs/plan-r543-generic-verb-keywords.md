# R543 — stop extracting bare generic action verbs as JD keywords

## Production evidence (CDP, fresh storage, index deployed after R542)
Paste a resume + the JD "We need a software engineer to build scalable distributed
systems with kubernetes, terraform, python and golang." into /ats-checker and Check:
the High priority fix reads `Add missing job keywords — 2 of 10 posting keywords are
absent ("build", "scalable")`. Follow Fix in builder → and the R542 Target-panel block
renders a `+ build` chip inviting the user to add the bare verb **"build"** to their
Skills list. "build" is JD boilerplate ("to build X"), not a skill — one tap and the
user's Skills line becomes `python, golang, …, build`, which reads as a typo to any
recruiter. Rezi's keyword scanner targets skill terms, not action verbs.

R181 filtered hiring boilerplate, R331 filler-word inflections, R357 generic verb
inflections (know/understand/prefer/…) — but common JD action verbs (build, create,
deliver, manage, …) were never covered.

## Root cause
`STOPWORDS` in src/lib/ats.ts (used by `extractKeywords`) has no entries for the
bare generic action-verb families that JDs use constantly. Any of them repeated ≥2
times (or in a short JD) becomes a "posting keyword" and, when absent from the
resume, a missing-keyword chip whose only offered action is appending the verb to
Skills.

## Minimal fix (ats.ts STOPWORDS only)
Add the inflection families of nine generic action verbs:
build/create/deliver/ensure/improve/provide/maintain/develop/manage
(each with -s/-ing/-ed/irregular forms). Noun skill forms — development,
management, delivery, maintenance, creation — remain extractable, as do all
KNOWN_PHRASES ("software development", "project management", …).

Effect: these verbs disappear from extracted JD keywords everywhere the shared
extractor is used (ATS score, checker, missing-keyword chips, triage, tailoring
report, interview coaching bridge) — matched/absent counts recompute honestly.

Non-goals: no scoring-formula changes, no changes to matching, no filtering of
skill nouns (design, support, lead stay because they double as nouns/skills),
no UI changes.
