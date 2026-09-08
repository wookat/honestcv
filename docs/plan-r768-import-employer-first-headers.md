# R768 — Import: employer-first headers and labelled school details (UK / Canva shape)

## Benchmark refresh (SOP-10, function-oriented, 5 rounds since R763)

- Rezi public pages (`qa/r768-rezi.mjs`, 8 URLs): same 7 pages as R763, same headings, `/resume-keyword-scanner`
  still 404 — no new surface to match.
- Production API (`qa/r768-api.mjs`): 5 searches (engineer / nurse / data analyst London / barista Chicago /
  product manager) all 200, sources Remotive + Jobicy + Arbeitnow + The Muse, 0 residual HTML / entities /
  Arbeitnow footer; `/api/ai/quota`, `/`, `/ats-checker`, `/pricing`, `/jobs`, `/sitemap.xml` all 200.
- Import path (never measured with a *real* university DOCX before — R763/R764 used PDFs): downloaded the
  Oxford Careers Service sample `traditional-cv-example-3.docx` (real Word 2007+ binary) and ran the
  production pipeline (`extractResumeFile` → `parseResumeText`, harness `qa/r768-docx.mts`, not committed).
  Extraction is coherent; the parser is not.

## Evidence (deterministic, deployed `parseResumeText`, zero AI)

Oxford sample, 7 experience headers all of the shape `Employer, Role; Dates`:

| source line | today |
|---|---|
| `Skin Bliss, Science Communication Micro-Intern (1 week); Dec 2023` | role `Skin Bliss`, company `Science Communication Micro-Intern (1 week); Dec 2023`, no date |
| `Oxford University Personalised Medicine Society, Publicity Officer; Oct 2023 - present` | role = society, company = `Publicity Officer` |
| `Riverview Kitchen, Waitress; Jul 2022 – Sept 2023` | role `Riverview Kitchen`, company `Waitress` |

7/7 headers inverted (`splitRoleCompany` always takes the first comma part as the role). The same inversion
already exists in the retained corpus without anyone measuring it: Canva templates put the employer on its own
line above the title (`Arowwai Industries` / `Oct 2020 - Present` / `Operations Manager`) and the second-header
path files `Arowwai Industries` as the role — canva-1 2/2, canva-2 2/3 entries, plus both Google-Docs
templates' `SheetsResume.com, Co-Founder`. 9 inverted entries across 5 of 114 retained texts + 7/7 in the new
sample. Inverted role/company reaches the ATS "role" checks, Tailor and every export.

Education, same sample:

| source line | today |
|---|---|
| `Grade: Passed with a 2:1 in first year exams` | **new school** titled `Grade: …` |
| `Modules: Multicellularity and Cell Signalling; …` | **new school** |
| `Crankstart Scholar (widening participation bursary …)` | **new school** |
| `A Levels: Chemistry A*, Mathematics A*, …` / `AS Levels: Biology A` / `GCSEs: 11 A*- A, …` | **three new schools** |

2 real schools → 8 education entries. `EDU_DETAIL_RE` knows the US vocabulary (`gpa`, `dean's list`,
`cum laude`, `coursework`) and none of the UK one; a labelled `Label: …` line under a school has no rule at all
(R767 only routed the `CUSTOM_HEADING_RE` labels). Corpus check (`r768-replay-before.json`): 4 labelled
degrees today (`Expected: Month Year`, `Portfolio: …`, `… Example: Bachelor of Arts …`, `Example: Expected May 2026`)
— all placeholders filed as schools.

Also measured and **not** changed: degree/school orientation (`St Mary's High School, Durham (…)` →
degree = school). The one corpus case with the school word on the degree side is `University of Florida, Gainesville, FL`
(school + location), where a swap would be wrong — left as a known boundary.

## Decision (smallest general rules, `src/lib/importText.ts` only)

1. `orientRoleCompany`: after any split (comma / dash / pipe / `at` / second header line), when the role side
   names no job-title noun and the company side does, swap. Both sides naming a noun, or neither, are untouched.
   Job-title nouns +`mentor ambassador apprentice trainee waiter waitress receptionist paralegal secretary treasurer`
   (student roles the UK sample uses; the list also vetoes section headings, none of these are heading words).
   Education keeps the raw split (a school aside like `(School Council Representative)` must not flip degree/school).
2. `SINGLE_DATE_RE`: a lone `Month YYYY` after a separator (`; Dec 2023`, `(Dec 2023)`) at the end of a header
   within 80 chars is the start date; date-stripping now also drops a trailing `;` and only removes a bracket
   when the dates were its content (`Micro-Intern (1 week)` keeps its bracket).
3. `isEduDetailLine`: under a school, an undated line is a detail when it carries the US/UK vocabulary
   (+`cgpa dissertation scholar bursary grade module(s) A levels GCSEs distinction merit first class`) **or** is a
   `Label: content` line whose label is not a degree word (`B.S.: …` still opens a school) and not a
   `CUSTOM_HEADING_RE` word (`Languages: …` / `Publications: …` keep the R767 routing).

## Results (114 retained texts, `qa/r768-replay.mts`, id-free JSON diff)

107/114 byte-identical. 7 changed, every change read:

- canva-1 (2), canva-2 (2), gdocs-sheets (1), gdocs-cloudcolleague (1): role/company now the right way round
  (`Operations Manager` @ `Arowwai Industries`, `Co-Founder` @ `SheetsResume.com`).
- canva-2 `Barista` / canva-3 `Business Analyst Intern` / pages-sumit `WebSockets…`: pre-existing garbage pairs
  (date string / phone number / skills line on the other side) — the title now sits in role; the other side is
  unchanged garbage.
- gdocs-sheets, stonybrook: placeholder `Expected: Month Year` / `Example: …` lines become the previous
  placeholder school's detail (education 4→3, 8→6).
- pages-sumit: misfiled `Portfolio: …` contact line becomes the real school's detail instead of a bogus second
  school (2→1).
- word-table (known unreliable) unchanged after the `CUSTOM_HEADING_RE` guard.

Oxford sample after: 7/7 experience entries `Role @ Employer` with dates (`Micro-Intern (1 week)` dated
`Dec 2023`), education 8 → 2 schools with `Grade / Modules / Scholar` and `A Levels / AS Levels / GCSEs` as
details, 5 labelled skills lines unchanged. Alex Morgan DOCX (R733 download) unchanged.

## Boundaries

- Orientation relies on the English job-title noun list; a title outside it (`Copywriter`) with an employer
  that contains a noun (`Tutor Perini`) would flip the wrong way — not observed in 114 + 1 texts.
- Single-date only for `Month YYYY`; a bare trailing year (`, 2023`) is not taken (too common in prose / degrees).
- Degree/school orientation not attempted (see evidence).
- Two real DOCX résumés + 114 PDF/text corpus; no LinkedIn / Europass DOCX sample yet.
