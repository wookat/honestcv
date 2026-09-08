# R770 — import: career-centre education layouts fill one entry per school

## Evidence (first, before any code)

R768's Oxford DOCX left one deliberate non-change: `St Mary's High School, Durham …`
was split raw (degree = "St Mary's High School", school = "Durham (Year 13 …)") because
one sample was not enough to change degree/school orientation. R770 replayed the 114
retained import texts (`qa/r768-replay.mts` → `qa/r770-edu.mts`) and read every education
entry the current parser produces:

- 30 entries where the *degree* field holds a school noun (`University Name`,
  `Cedarville University`, `University of Florida | Gainesville, FL`, `High School Name`);
- 12 entries where the *school* field is a degree (`Bachelor of Degree Obtained`,
  `BA/BS Name of Major; GPA: …`, `Title of Bachelor's Degree`);
- the shape behind them is the same in every US career-centre template (UF, Cedarville,
  Stony Brook, two Google Docs): **school line / place line / degree line / expected-
  graduation line / GPA line**, one field per line. The parser opened a new entry for each
  line that did not match `EDU_DETAIL_RE`, so one school became 3–5 rows.

Realistic probes (`qa/r770-edu-cases.mts`, deterministic, no AI) before the change:
UF shape → 3 rows (`University of Florida | Gainesville, FL` as degree; `Bachelor of
Science…` as a second degree; `Expected May 2026` as a third); degree-first-then-school
two-school block → 4 rows; Oxford school row reversed.

## Decision

Classify an education line by what it names and let it **fill the open entry** instead of
opening a new one — orientation is decided by a degree noun / school noun, not by position:

| line shape | rule |
|---|---|
| has a degree noun, open entry has no degree (or its "degree" is really a school and the line has no school noun) | degree ← line head (`;` splits details; `, <School>` / `— <School>` splits school; trailing `City, ST` → location) |
| has a school noun, open entry's degree names a degree and school is empty | school ← line; trailing place → location, other tail → details |
| `City, ST` with no school/degree noun, open entry has no location | location |
| `Expected May 2026` / `Graduating May 2026` / `… Expected Graduation` | end date when it is a month-year, else details |
| `Label: items` (`GPA:`, `Minor(s):`, `A Levels:`) | details (R767/R768 unchanged) — never a degree even when the label vocabulary includes a degree word |
| detail-looking line that also names a degree, open entry already complete | new entry (`Bachelor of Arts in Economics; GPA: 3.7` after Columbia) |
| first line of an entry names a school and no degree | school-first entry (`St Mary's High School, Durham`), degree empty; a following degree line fills it |

Guards taken from replay misses: the school-under-degree rule requires the open entry's
degree to *name* a degree (so a bootcamp line without a noun is not glued to the next
school); labelled rows are excluded from degree detection (`A Levels: Chemistry A*, …`
was briefly consumed as a degree and lost its comma tail — caught by the Oxford probe);
`a-levels`/`gcses` dropped from the degree vocabulary for the same reason.

Rejected: treating any line with "University" as a school regardless of the open entry
(replay turned bullets and template prose into schools — the first R770 draft, 7/114
files changed with several regressions); bare-year single dates (R768 boundary, unchanged).

## Results

- `qa/r770-edu-cases.mts`: UF shape → 1 row with school / degree / location / end
  `May 2026` / details; Columbia + Michigan → 2 complete rows; Cedarville → 1 row with
  `GPA: 3.9; Minor(s): Bible; Honors: Dean's List`; Oxford → school `St Mary's High School`
  with all four grade rows in details, MBioChem row unchanged; Alex single-line control
  byte-identical; two single-line bootcamp rows unchanged (no degree noun → no merge).
- 114-file replay: 107 byte-identical. Changed: canva-1 (5 → 3 rows, all three now
  school + degree), gdocs-cloudcolleague / gdocs-sheets (3 → 1 row each), word-cu (first
  block 3 → 1 row: school / degree / `Cedarville, OH` / GPA details), word365-ufl (5 → 3,
  first row complete), stonybrook (instructional prose, neutral), canva-3 (R746-known
  interleaved multi-column, 17 → 13 rows, neutral).
- Oxford DOCX via `extractResumeFile` → `parseResumeText`: 2 schools, second now
  `school: St Mary's High School`, details keep `A Levels: … GCSEs: …` verbatim.

## Known boundaries

English degree / school vocabulary; a degree line with no degree noun (`Full-Stack Web
Development`) still opens its own row; bare years after `|` are not dates (R768);
`Degree (e.g., B.S.), Majors (…)` template text keeps its commas by design.
