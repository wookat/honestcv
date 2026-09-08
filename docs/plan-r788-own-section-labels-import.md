# R788 benchmark refresh → R789 — the importer reads every heading the product prints

## Benchmark refresh (function-oriented SOP-10, 5 rounds since R783)

- Rezi public pages (`/home/ubuntu/qa/r788-rezi.mjs` → `r788-rezi.json` vs `r783-rezi.json`):
  8 URLs, status / redirect / title / description / headings identical to the R783
  snapshot (keyword-scanner still 404). Rezi still sells build / score / tailor /
  job search / mock interview / templates; no new public surface.
- Production routes `/`, `/builder`, `/ats-checker`, `/jobs`, `/dashboard`, `/documents`,
  `/templates/bold/`, `/examples/software-engineer/` → 200; `/pricing` → 307 → `/pricing/`.
- `/api/jobs/search` five queries → 150 / 27 / 1 / 150 / 70 rows, every row with its
  feed; the one raw-markup row is Jobicy's `<<NAMER version; …>>` marker (upstream
  text, not our markup — recorded, not in scope). Quota 200.
- Architecture surfaces unchanged since R783 (streaming + cancel, grounding
  post-checks, feed snapshots, import regression suite at 150 tests).

No P0. The P1 below is the next link of the product's own export → import loop, found
by pushing the R783 idea from the six core sections to the rest of the section model
and to the four non-English label sets the Builder offers.

## Evidence (`qa/r788-headings.mts`, `qa/r788-es.mts`, `qa/r788-sections.mts`)

A sample resume carrying Involvement, Coursework, Awards & Honors, Publications and
Military service entries, exported with our own serialisers and read back through
`parseResumeText` (the paste path of /ats-checker and the Builder Import dialog, and
the text the PDF / DOCX upload paths hand over):

| export                                    | result                                                                                                                     |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| TXT, 15 `headingCase: 'upper'` PDFs       | 2 experience / 1 education, five custom sections — the ALL-CAPS labels hit the generic short-caps rule                       |
| MD, 10 `headingCase: 'title'` PDFs (compact, minimal, elegant, ivy, slate, scholar, coral, prairie, quartz, ledger) | `Involvement` becomes an **experience entry** (role `Involvement`, no company); the Coursework course becomes an **education entry**; `Military service` becomes a **school** and `Sergeant — US Army` a second school; only `Awards & Honors` / `Publications` survive (they are in `CUSTOM_HEADING_RE`) |
| Spanish / German / Portuguese TXT, MD, PDF | **1 empty experience, 1 empty education, no summary, no skills, no custom sections** — `RESUMEN` / `EXPERIENCIA` / `EDUCACIÓN` / `HABILIDADES` are not headings to the parser, so the whole document is body text |
| French TXT / MD / PDF                     | same for the core sections; `PRIX ET DISTINCTIONS` / `SERVICE MILITAIRE` survive only via the short-caps rule                 |

Root cause, read in the code: the importer's heading tables (`SECTION_HEADINGS`,
`SECTION_WORDS`, `CUSTOM_HEADING_RE`) are an English vocabulary that predates the
section model. `SECTION_LABELS` / `SECTION_LABELS_I18N` in `resume.ts` are the exact
strings every preview, PDF, DOCX, TXT and MD prints, in five languages, and the parser
never consults them. Title-case `Involvement` / `Coursework` / `Military service` pass
`looksLikeHeadingShape` but name no section word, so they fall through to the section
body and are read as an entry header.

Who hits it: anyone who re-imports their own download (the R783–R787 loop), and every
user who writes in one of the four non-English languages the Builder offers — their
own PDF cannot be imported at all.

## Fix (narrow)

1. `resume.ts` exports `defaultSectionLabels()`: every `(key, label)` the product prints
   — `SECTION_LABELS` plus the four `SECTION_LABELS_I18N` sets.
2. `importText.ts` indexes those labels once (`OWN_HEADINGS`: lower-cased, and with
   spaces removed for letter-spaced headings). A line that is exactly one of them:
   - core key (summary / experience / education / skills / projects / certifications)
     → that section, in `matchHeading`, `matchInlineHeading` (`Habilidades: React, …`)
     and `matchGutterLabel` (Sidebar template: `EXPERIENCIA Software Engineer · …`);
   - any other key (involvement / coursework / awards / publications / references /
     military / agents) → a custom section titled with the **canonical label**
     (`INVOLVEMENT` → `Involvement`, `PREMIOS Y RECONOCIMIENTOS` → `Premios y
     reconocimientos`), in `matchCustomHeading` and `matchGutterLabel`.
3. Nothing else moves: the English vocabulary tables, the entry-header guards
   (`JOB_TITLE_NOUN_RE`, `CREDENTIAL_TITLE_RE`, `ENTRY_HEADER_BINDER_RE`), the
   structured-array model (involvement / awards / publications still come back as
   custom sections — a separate contract question, see below).

Rejected: adding foreign section vocabularies by hand (no corpus evidence beyond our
own labels; the product's own strings are the only first-hand set); detecting the
document language and setting `resume.language` (the Builder import keeps the draft's
language via `keepTargetOnImport`; /ats-checker scores in English regardless).

## Verification

- Tests: `tests/import/rules.test.ts` + 4 (3 fail on the R787 parser; the whole-line guard passes on both):
  every-section resume through `resumeToPlainText` / `resumeToMarkdown` in EN / ES / FR / DE / PT
  reads back 2 / 1 / same skills / same summary with five custom sections in section order
  (`Involvement | Coursework | Awards & Honors | Publications | Military service` and the localized
  titles), `Mentor` and `Sergeant` preserved as content; title-case `Involvement` / `Coursework` /
  `Military service` under a Markdown-shaped resume no longer become a role or a school; `RESUMEN …` /
  `EXPERIENCIA …` / `EDUCACIÓN …` / `HABILIDADES …` gutter lines, `Kenntnisse: …` inline and
  `E X P E R I E N C I A` letter-spaced open their sections; `Engagement Manager · Acme Corp` with
  bullets naming `Cursos` / `Publications` / `Kurse` stays one experience, 0 custom sections.
  `matchGutterLabel` accepts accented capitals (`\p{Lu}`) — `EDUCACIÓN Grado en …` was rejected by the
  ASCII caps run. `npm test` 154; goldens unchanged.
- Local: 186-file replay (`qa/r789-replay.mts`, R787 parser vs branch) **184 identical**; the 2 changes
  are one Word template (`word-cu.pdf` + its pdf.js text) whose custom-section title goes
  `INVOLVEMENT` → `Involvement` — title casing only, bullets byte-equal. Gates tsc app + worker + test /
  eslint / vitest / build / verify-dist green.
- Deployed `index-TrE18YGi.js` + `importText-Cmdj55rI.js` (SHA-256 identical to dist); Routes
  `code 10000` as always. Production QA (testing agent) 1280 + 375, cache disabled, 13 fresh-tab
  journeys, 0 downloads: EN TXT upload / EN MD ATS paste / EN MD Builder Import paste / ES TXT upload /
  ES MD paste / independent 375 EN TXT upload / independent 375 ES MD paste — all 2 / 1, 216-char
  summary, 81-char skills, five custom sections with the expected titles, order, line counts and
  content (`Mentor / Women Who Code Austin`, `Sergeant / US Army`), 0 normalised diffs TXT vs MD, ATS vs
  Builder, desktop vs mobile, EN vs ES core fields; accented gutter probe → exact summary, `Ingeniera
  Senior / Northstar Digital`, `Grado en Informática / Universidad de Madrid`, skills `TypeScript, React`;
  guard probe → 1 experience / 2 bullets / 0 custom. Regression: Oxford 82 7 / 2 (`Dec 2023` once, literal
  `A*`), Alex 95 2 / 1, Sumit 82 4 / 1 / 4 (3 / 3 / 3 / 2) unchanged; Kenneth 50 22 / 5 with one field
  moved — `customSections[0].title` `PUBLICATIONS` → `Publications` (the canonical-title change, same as
  the replay). 375 `scrollWidth = clientWidth` 375 / 375, 0 horizontal scroll. 0 console / page errors,
  0 failed requests, 0 HTTP ≥ 400, 0 POSTs (13 quota GETs), 0 downloads / leads / shares / payments /
  copies / deletes; storage equal to baseline byte-for-byte at all 13 checkpoints
  (`/home/ubuntu/qa/r789-cleanup.json`). Recording
  `/home/ubuntu/screencasts/r789-own-section-import/r789-own-section-import-edited.mp4`; structured
  `/home/ubuntu/qa/r789-results.json`.
- Seen by this QA, already a recorded boundary above, queued first for R790: the same content scores
  **95 / 22 checks** from the EN export and **82 / 17 checks** from the ES export — `/ats-checker`
  reads English headings only (`Standard section headings` and `Skills section present` fail, the five
  role / date checks do not run).

## Boundaries (recorded, not changed)

- Dates typed in another language (`ene. 2022 – actualidad`) are still not read as
  dates; `Present` / `current` / `now` only.
- ATS checks ("standard section headings", experience block) read English headings
  only; a Spanish resume still scores as if it had no sections.
- Structured `certItems` / `involvement` / `coursework` / `awards` / `publications` /
  `military` re-import as free-text `certifications` and custom sections (the parser
  has no structured target for them); the content is kept, the shape is not.
- A user's own custom heading text is still matched by the English `CUSTOM_HEADING_RE`
  and the short ALL-CAPS rule as before.
