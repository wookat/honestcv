# R763 — function benchmark refresh (5 rounds since R758) + PDF import: entry headers are not section headings

## Benchmark refresh (first-hand, 2026-09-08)

### Rezi public pages (`qa/r763-rezi.mjs` → `qa/r763-rezi.json` / `.out`, 8 pages)

`/`, `/ai-resume-builder`, `/pricing`, `/resume-checker`, `/job-search`, `/ai-cover-letter-builder`, `/ai-interview`,
`/resume-keyword-scanner`: feature vocabulary unchanged against the R758 snapshot (AI writer, resume score, tailoring,
keyword scanner, cover letter, interview practice, job search + tracking with bulk actions, sample resumes, ATS
formats, export formats). **No new P0/P1 from the public pages.**

### Production golden paths / API (`qa/r763-api.mjs`)

- Routes `/`, `/ats-checker`, `/pricing`, `/jobs`, `/sitemap.xml` → 200; `/api/ai/quota` → 200 `{"freeRemaining":12}`.
- `/api/jobs/search`: `engineer` 150 rows (Remotive 5 / Jobicy 50 / Arbeitnow 95), `nurse` 27 (24 / 3),
  `data analyst`+London 69 (Jobicy 50 / Arbeitnow 15 / Muse 4), `barista`+Chicago 4 (Arbeitnow 3 / Muse 1),
  `product manager` 150. Sampled descriptions: no raw HTML / entities / Arbeitnow footer (R724 / R754 hold).
- Deployed bundle before this round: `index-dUpbvaSX.js`, version `7f6e0bc0`.

### Real external PDFs through the production import path (queue item since R746 — "Word / Google Docs / Canva sampling")

Harness `qa/r763-real-imports.mts`: `pdfjs-dist` → `getTextContent()` → **the same `pdfPageText()`** the browser
uses (`src/lib/extractFile.ts`) → `parseResumeText()`. Ten files in `/home/ubuntu/qa/r763-pdfs/` (not committed):

| file | producer | pages | layout | extraction | structure before |
|---|---|---|---|---|---|
| canva-1/2/3 | Canva | 1 | 1-col (3: sidebar) | coherent | template text ("Arowwai Industries"); 3: contact leaks into EXP |
| chrome-print-ronstr8 | Skia (Chrome print) | 3 | 1-col | coherent | 13 custom sections, 0 EXP |
| gdocs-cloudcolleague / gdocs-sheets | Skia Google Docs Renderer | 1 | 1-col | coherent | instructional template ("use tabs and spaces to align-right…") |
| pages-mac-sumit | macOS Quartz | 2 | **2-col** | reordered stream | right-pane skill lines become EXP entries |
| word-cu / word365-ufl | Microsoft Word | 2 / 1 | 1-col | coherent | placeholder text ("Name of Company"); ufl 0 EXP |
| word-mac-quartz-stonybrook | Quartz (Word→Mac) | 2 | 2-col | reordered stream | template |

Findings, honestly separated:

1. **Extraction is not the failure mode** on any single-column file: every `.pdfjs.txt` reads top-to-bottom with headings,
   dates and bullets intact. Two-column files (Pages, Word-on-Mac template) yield a visually reordered stream — the known
   R746 boundary ("two-column / table layouts not reliable"), unchanged, **not fixed here**.
2. **Most collected files are templates**, not candidate resumes ("Name of Company", "Your Position", "use tabs and
   spaces…"). Their parse results say nothing about production users and are not used to justify code.
3. What the structured parser *does* miss on the coherent single-column text is heading **shape**: letter-spaced
   headings (`W O R K  E X P E R I E N C E` — Canva / Word character spacing), inline headings (`Technical Skills: Java,
   SQL`), headings with an aside (`WORK EXPERIENCE (most impressive first)`), and section words the closed table lacks
   (`Career History`, `Areas of Expertise`, `Relevant Experience`).
4. While building a plain-text control for (3) the harness found a **pre-existing defect unrelated to the samples**:
   `SECTION_HEADINGS` is anchored at line start, so **`Project Manager · Acme Corp` (≤ 40 chars) matches `^projects?\b`
   and opens a Projects section** — the role, its dates and its bullets are lost from Experience and land in Projects
   as `name: "Jan 2020 – Present"`. Same class: `Education Program Manager`, `Skills Trainer`. Reproduced on the
   deployed code with a 6-line plain-text resume (`qa/r763-edge2.mts`): `experience: [empty]`, `projects: [{name: "Jan 2020 – Present", description: "Led …"}]`.
   Project Manager is one of the most common titles on the site's own `/examples/` (`project-manager`,
   `construction-project-manager`), so this is a **P1 import defect with a deterministic reproduction**, and the item
   chosen for this round.

**Classification**: (4) parser defect (P1, fixed); (3) heading-shape coverage (P2, fixed alongside because the same
guard is needed for both); (1) two-column layouts remain a disclosed boundary; (2) templates are not evidence.

## Fix (`src/lib/importText.ts` only)

- `JOB_TITLE_NOUN_RE` (manager / engineer / analyst / coordinator / intern / lead / …): a line containing a job-title
  noun is never a section heading — applied to the start-anchored table, the contains-match path and inline headings.
  `Volunteer Experience` still reaches `matchCustomHeading` (unguarded, as before).
- `matchHeading`: letter-spaced line (`(?:[A-Za-z&/] ){3,}[A-Za-z&/]`) is collapsed and matched against
  `SECTION_WORDS`; a trailing `(aside)` is dropped; a short heading-shaped line (≤ 6 words, Title-Case / ALL-CAPS,
  no sentence punctuation or digits) matches `SECTION_WORDS` anywhere (`Career History`, `Areas of Expertise`).
- `matchInlineHeading`: `Technical Skills: Java, SQL` sets the section and feeds the remainder as the first line.
- `matchCustomHeading`: letter-spaced custom headings (`E X T R A C U R R I C U L A R  A C T I V I T I E S`) are
  collapsed and the known last section word re-spaced.

## Measurements

- Plain-text control (`qa/r763-edge.mts`): before — 0 experience entries, `Leadership, Negotiation`/skills lost;
  after — `Project Manager · Acme Corp` (Jan 2020, 1 bullet), `Customer Experience Lead` (2 bullets), `Java, SQL,
  Python` skills, `BSc Computer Science · State University`, custom `EXTRACURRICULAR ACTIVITIES`.
- R746 browser-equivalent replay (`qa/r746-extract.mts`, 54 PDFs incl. ReportLab + LibreOffice variants): output
  **byte-identical** before/after (`/home/ubuntu/qa/r763-r746-{before,after}.txt`).
- Real samples after: `word365-ufl` 0 → 3 EXP (template placeholders, as expected); `pages-mac-sumit` gains
  `PROFESSIONAL SUMMARY`, all four dated roles and both awards, right-pane skill rows still leak (two-column boundary);
  Canva / Google Docs / Chrome files unchanged in structure (template content).
- Not fixed, recorded: `Leadership, Negotiation` under a skills heading is taken as a custom `Leadership` section
  (pre-existing `CUSTOM_HEADING_RE` start-anchor with no shape check); a role header split over two lines
  (`Customer Experience Lead` + next header) merges with the next role.

## Gates

tsc app + worker / eslint (`ats.ts`, `grounding.ts`, `importText.ts`) / build / verify-dist green.

## Production QA

Deployed `index-DC-OWHvl.js` + `importText-C1x9-hUo.js` (Routes `code 10000` as always; production import chunk
byte-identical to dist). `/ats-checker` upload → "Fix in builder" at 1280 and 375 with a ReportLab resume whose first
role is `Project Manager · Acme Corp, Austin, TX` (`/home/ubuntu/qa/r763-import-verify.cjs`): 2 roles (Project Manager
Jan 2020 – Present, Project Coordinator Jun 2017 – Dec 2019) / 3 bullets / 1 education / `Java, SQL, Python, Jira`
skills; `pages-mac-sumit.pdf` at 1280: name/email/phone, four dated roles, 12 bullets, B.Tech — right-pane skill
rows still appear as extra rows (two-column boundary, disclosed). 0 console errors, no horizontal overflow.

## Refreshed P0/P1 gap list (four dimensions)

- Workbench: none open (R586–R702 closure work holds; no new relationship gap seen on the golden path).
- Core functions: **P1 fixed this round** (Project Manager import loss); remaining P2 — two-column PDF import,
  Tailor `mirrored` policy false positives, long-ad single-mention names under the 30-keyword cap (`rag`, `english`).
- Landing / home UI: none new (routes 200, no overflow at 1280/375).
- Architecture: Remotive shared snapshot (R762) holding; Adzuna / JSearch keys still a resource request.

Next: R764 by evidence — two-column PDF import (column detection is already reported by `pdfPageText`; decide whether
to split columns or disclose "two-column layout — check the import" in the UI), then Tailor `mirrored`, then the cap.
