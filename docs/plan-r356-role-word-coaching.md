# R356 — keep target-role words out of interview keyword coaching

## Evidence (first-hand, production R355 audit)
- With target role "Product Manager", R201/R250 answer coaching and the R258 session report listed **product** as a missing keyword to work into answers. `manager` is filtered by the static `JOB_TITLE_WORDS` list, but `product` is not — the split treatment reads arbitrary and coaches candidates to say their own job title.
- R325 already solved this exact problem for question generation: `skillLikeKeywords()` excludes `resume.targetRole` tokens. Answer coaching (`coachableKeywords()`) never received role context, so the two filters disagree within the same dialog.

## Design
- Thread the target role into the coaching filter: `analyzeAnswer(answer, jd, ignoredKeywords, targetRole?)` and `sessionReport(entries, jd, ignoredKeywords, targetRole?)`; `coachableKeywords(keywords, roleTokens)` additionally drops single-word keywords that are tokens of the target role (same tokenization as `skillLikeKeywords`).
- Multi-word keywords are never dropped (same rule as both existing filters). Empty/absent role keeps today's behavior byte-for-byte.
- Builder passes `resume.targetRole` at both call sites (live analysis card + finish-session report).

## Non-goals
- JD keyword extraction, ATS scoring/tiers, and the resume-side R256 bridge lists are untouched — `product` legitimately stays in resume keyword targeting; this only affects interview answer coaching.

## Verification
- Oracle: PM JD fixture — coaching excludes `product`/`manager`, keeps `roadmap`, `sql`, multi-word phrases; empty role unchanged; ignoredKeywords still respected.
- tsc/eslint/build; deploy; production QA (mocked AI, zero quota): coaching list without title words, R258 report consistent, R355 bridge + R333 guard regression, 375/dark, baseline restore.
