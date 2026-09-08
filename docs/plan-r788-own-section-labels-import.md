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
