# R332 — import parser: fold honors/GPA lines into education details

## Evidence

R332's exploratory import-chain audit (docs/plan-r332-import-chain-audit.md)
found the only defect (P3): under EDUCATION, an undated honors line like
`GPA 3.8, Dean's List` imported as a bogus second entry
`{school: "Dean's List", degree: "GPA 3.8"}` (both PDF and DOCX paths) —
`parseResumeText`'s education case treats every non-bullet, non-date-only
line as a new entry header.

## Change (importText.ts)

New `EDU_DETAIL_RE` (`gpa | dean's list | cum laude | hono(u)rs | minor |
major | coursework | thesis | scholarship | award`, case-insensitive) and one
extra branch in the education case: an undated line matching it while an
entry is open folds into `currentEdu.details` (`'; '`-joined, same as the
bullet path) instead of opening a new entry. Dated lines and headline lines
are untouched, so real multi-entry resumes still split.

Known ambiguity kept as-is: a line starting with `Honors …` matches the
pre-existing `CUSTOM_HEADING_RE` before section logic and becomes a custom
section — unchanged behavior, out of scope.

Oracle `.tmp-smoke/r332_oracle.ts` 6/6; tsc/lint/build green.

## QA (production)

Import the audit's PDF/DOCX fixture again: one education entry with
`GPA 3.8, Dean's List` in details; multi-entry education still splits;
R303 guards, 375 strict + dark regression.
