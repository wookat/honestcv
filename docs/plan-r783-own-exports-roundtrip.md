# R783 — our own TXT / Markdown exports do not survive our own importer

## Benchmark refresh (function-oriented SOP-10, 5 rounds since R778)

- Rezi public pages (`qa/r778-rezi.mjs` → `/home/ubuntu/qa/r783-rezi.json`): 8 URLs,
  status / title / headings identical to the R778 snapshot (keyword-scanner still 404).
  No new Rezi surface to benchmark against.
- Production routes `/`, `/builder`, `/ats-checker`, `/jobs`, `/dashboard`, `/documents`,
  `/templates/bold/`, `/examples/software-engineer/` → 200; `/pricing` → 307 → `/pricing/`.
- `/api/jobs/search` five queries → 150 / 27 / 3 / 150 / 71 rows with per-row feed
  attribution; one Jobicy row still carries an upstream `<<NAMER version; …>` marker
  (upstream text, not our markup — recorded, not in scope).
- `/api/ai/quota` → 200.

No P0. The P1 below comes from turning the R780 golden idea on the two exports the
corpus never covered: the product's own TXT and Markdown downloads.

## Evidence (`qa/r783-txt.mts`, `qa/r783-docx-roundtrip.mts`)

`resumeToPlainText` is the text every AI prompt, every grounding post-check and the
ATS check read, and the TXT download; `resumeToMarkdown` is the MD download
("for AI tools, GitHub profiles and quick edits"). Re-imported through
`parseResumeText` (the paste path of /ats-checker and the Builder Import dialog):

| source → paste back              | result                                                                                  |
| -------------------------------- | --------------------------------------------------------------------------------------- |
| Northstar TXT                    | company `Northstar Digital ()`, `Harbor Analytics ()`; school `University of Bristol ()`; 3 locations lost |
| Sample TXT                       | company `Brightlane ()`, `Nova Retail ()`; degree `B.S. Computer Science, University of Texas`, school `Austin ()`; 3 locations lost |
| Northstar MD                     | name `# Alex Morgan`, everything else empty (0 experience, 0 education, no summary, no skills) |
| Sample MD                        | same — 24 field diffs, nothing but the `#`-prefixed name survives                        |
| DOCX (25 templates × 2 resumes)  | parses like the PDF path (company / location / school right); the only diffs vs TXT are the TXT defects above |

Three root causes, each read in the code:

1. `stripDateRest` removes the dates but keeps the now-empty brackets when both
   parentheses survive the slice: `Role at Company (Jan 2022 – Present)` →
   `Role at Company ()`. It only handled the dangling `Role (` case.
2. `splitRoleCompanyRaw` tries ` at ` before `,`: `B.S. Computer Science,
   University of Texas at Austin` splits inside the school's name. The corpus has
   ` at ` as a real separator once (`Advanced Data Scientist at Honeywell`) and as
   part of a school name five times (`University of Texas at Austin / Dallas`), all
   protected today only because those lines use ` · ` first.
3. The TXT / MD renderers print no `location` for experience or education — the
   only two renderers of eleven (25 templates, PDF, DOCX) that drop a field the
   user typed; the AI context and grounding checks therefore never see where the
   user worked.
4. Markdown structure (`### `, `## `, `*(dates)*`, `[title](link)`) is not
   recognised by the importer at all; `#`-lines fail the heading tables and the
   name rule keeps the `#`.

## Change (narrow)

- `stripDateRest`: also drop an empty `()` left where the dates were.
- `splitRoleCompanyRaw`: ` at ` is not a separator when the text left of it names a
  school (SCHOOL_RE) and the text right of it does not — the `at` belongs to the
  school's name (`University of Texas at Austin`, `University at Buffalo`).
- Trailing place after ` at ` / ` — ` / ` | ` splits: peel `, City, ST` / `Remote`
  (existing) **or** a `, City, Country` tail that passes `isExpPlaceLine`
  (`Northstar Digital, London, UK`, `Acme, Berlin, Germany`).
- Education comma split with ≥3 parts: a trailing place (`isEduPlaceLine`) becomes
  the location (`B.S. Computer Science, University of Texas at Austin, Austin, TX`).
- TXT / MD export: `Role at Company, Location (Dates)` and `Degree, School, Location (Dates)`
  when a location exists — same shape the templates print.
- Markdown pre-pass in `parseResumeText` when ≥2 lines start with `#{1,6} `:
  strip heading markers, `*(…)*` → `(…)`, `[title](url)` → `title (url)`, whole-line
  `*italic*` → plain. Bullet-level inline marks (`**bold**`, `A*`) untouched (R769).

## Non-goals

- `groupByCompany` TXT/MD shape (company line then role lines) — not in the fixtures.
- Skills flattening in the Northstar fixture — the stored value is already flat (R743 residue).
- Changing the PDF/DOCX renderers — they already round-trip.

## Validation

- `qa/r783-txt.mts`: TXT and MD of Northstar + sample → 0 field diffs vs source.
- 186-file replay vs R782 (`qa/r783-replay.mts`), every change read.
- New tests in `tests/import/rules.test.ts`; product-owned fixtures
  `northstar-export-txt.txt` / `northstar-export-md.txt` + goldens.
- Gates: tsc app/worker/test, eslint, build, verify-dist, `npm test`.
- Production QA 1280 / 375: TXT download → paste into /ats-checker and Builder Import;
  MD download → paste; PDF regression set unchanged.

## Result (after implementation)

- Also found while writing the tests: a project header from our own export,
  `AlgoLens · Hack Club (https://…) (Mar 2021 – Jun 2021)`, re-imported as
  `AlgoLens () (Mar 2021` — the Projects branch never read dates / org from the
  header line. Fixed in the same branch: `extractDates` + `stripDateRest` on the
  header, ` · ` split into name / org only when there are exactly two parts
  (Sumit's real `Name · Live Demo · Source Code` label rows stay a name).
- `placeTail` refuses tails that contain `present / current / year / month` —
  the Google Docs placeholder rows `Month, Year – Present` were the only
  replay change before this guard.
- Round trip: Northstar + sample × TXT + MD → 0 field diffs (contact, summary,
  skills, experience, education, projects).
- Replay: 186 / 186 identical vs the R782 parser (text + PDF).
- Tests: 130 (was 123); two new fixtures parse to byte-identical goldens.
- Gates: tsc app / worker / test, eslint, build, verify-dist green.
- Side effect, intended: `resumeToPlainText` now carries experience / education
  locations, so ATS matching, grounding evidence text and AI prompts see the
  same locations the PDF already printed.
