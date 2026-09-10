# R780 — A credential's name is not a section heading; import regression suite in-repo

## Evidence

### The heading false positive (R779 queue item)

- canva-2 (Canva template, PDF → pdf.js text, interleaved two-column zone
  recorded as unreliable since R764) reads, in order:

  ```
  E D U C A T I O N & C E R T I F I C A T I O N S
  E X T R A C U R R I C U L A R A C T I V I T I E S
  Bachelor of Business Administration
  President, Business Club
  Majors: Analytics and Project Management
  Ginyard International Co.
  Community Volunteer
  Graduate Project Management Certification     ← opens "Projects"
  Paucek and Lage
  Ginyard International Co.
  Impact Evaluation Methods 3-Day Short Course
  Liceria & Co.
  ```

  `matchHeading` reaches its last branch — a ≤48-char Title-Case line, ≤6
  words, no punctuation — and scans `SECTION_WORDS` in order; `projects?`
  matches `Project` before `certifications?` gets a look. Four following
  lines become four empty projects (`Paucek and Lage`, `Ginyard International
  Co.`, `Impact Evaluation Methods 3-Day Short Course`, `Liceria & Co.`).
- Trace of that generic branch over the 186-file corpus (114 retained texts +
  72 pdf.js extractions): it fires 9 times. 8 are real headings —
  `RESEARCH EXPERIENCE`, `RELEVANT EXPERIENCE`, `ADDITIONAL EXPERIENCE`,
  `RELATED PROJECTS`, `Research Skills`, `ACADEMIC/RESEARCH/EMPLOYMENT
  EXPERIENCE`, `WORK/INTERNSHIP/RESEARCH/RELEVANT EXPERIENCE`, and the
  canva-2 line is the only false positive.
- Every corpus line that ends in a credential noun:
  `Graduate Project Management Certification` (×2, canva-2 pdf + text),
  `Impact Evaluation Methods 3-Day Short Course` (×2, same file),
  `Google UX Design Certificate`, `Title of Diploma`, and the heading
  `CERTIFICATIONS`. Only the first is misread; none of the others is a
  heading either, and the true heading is plural.
- The same shape is what any CV that lists credentials under Education /
  Activities produces: `Project Management Professional Certification`,
  `Certificate in Project Management`, `Advanced Diploma in Data Analytics`.
  The word `Project` (or `Skills`, `Experience`) inside such a title is a
  subject, not a section.

### No test runner

- Acceptance in every wookat repository is local tests / lint / typecheck /
  build (GitHub Actions stay disabled). This repository had no test runner
  and no test file; the R746–R779 replay harnesses (`qa/*.mts`) and every
  fixture they read live only on the current VM. R779 showed the cost: the
  "Oxford 7/2" oracle quoted in four rounds of QA was the parser's own
  output, never a reviewed expectation, and it hid a date parsed as a role.

## Decision

### Parser

One exclusion, evaluated before both heading tables (prefix table and
generic word scan) and after the job-title exclusion it mirrors:

```ts
const CREDENTIAL_TITLE_RE =
  /^(?:\S+\s+){2,}(?:certification|certificate|licen[cs]e|diploma|course)$
   |^(?:certification|certificate|licen[cs]e|diploma|course)\s+(?:in|of)\s/i
if (JOB_TITLE_NOUN_RE.test(t) || CREDENTIAL_TITLE_RE.test(t)) return null
```

- Singular credential noun closing a line of ≥3 words, or opening one with
  `in` / `of` — the two ways English names one credential. The plural
  section titles (`Certifications`, `Certificates`, `Licenses`,
  `Professional Certifications`) do not match; a two-word line such as
  `Coursera Certificate` is left to the existing rules (it matches nothing).
- Letter-spaced headings are matched before this check and are unaffected.
- Not done: removing `projects?` from `SECTION_WORDS` (breaks `RELATED
  PROJECTS`), ordering `certifications?` first (the line is still not a
  heading), or any wider suppression of `project` / `experience` / `skills`.

### Regression suite

Commit a golden-file suite for the import path so any change to the parser
or extractor shows up as a reviewed diff in the PR and a fresh machine can
run it with `npm test`.

- Runner: **vitest 4.1.11** (Vite-native; 5.0.0 was published 2026-09-03, under a week ago, and
  is skipped under the 7-day rule). `npm test` = `vitest run`;
  `vitest.config.ts` is standalone so the Cloudflare / React / Tailwind
  plugins are not loaded; `tsconfig.test.json` is referenced from
  `tsconfig.json` so `tsc -b` (part of `npm run build`) type-checks tests.
- Fixtures under `tests/import/fixtures/` are **only files this product owns
  or generated**: the Northstar / sample text and the 25 template PDFs the
  product exported from it (R746), Alex Morgan (product sample), and the
  three `synth-*` PDFs. Third-party templates (Canva, Google Docs, Word /
  career-centre, Oxford) and every real person's CV (ronstr8, Sumit, Kenneth,
  Giovanni, Bhu) stay in the VM corpus (`/home/ubuntu/qa`, `qa/r780-replay.mts`
  replays all 186 against the previous parser) — redistribution rights and
  personal data are not this repository's to decide.
- `tests/import/corpus.test.ts`: `parseResumeText(text)` per text fixture and
  `leftMargin / pdfPageText → parseResumeText` per PDF (the production
  extractor path), compared with `toMatchFileSnapshot` (ids stripped). Update
  with `npm test -- -u` and read the diff.
- `tests/import/rules.test.ts`: one `it()` per behaviour a golden alone would
  not name — R763, R767, R768, R770, R775, R776, R778, R779, and R780 (the
  canva-2 shape as a synthetic Activities section; compound headings
  `RESEARCH EXPERIENCE` / `RELATED PROJECTS` / `Research Skills` /
  `Professional Certifications` still open their sections).
  `tests/marks.test.ts` covers CommonMark flanking (R769).

## Rejected

- Committing third-party templates or personal CVs as fixtures.
- Snapshotting only counts (`7/2`) — R779 is exactly the failure counts hide.
- Leaving canva-2 as "1/186, unreliable zone": the misread is not a property
  of the zone but of any credential title containing a section word, and the
  exclusion costs no true heading in the corpus.

## Verification

- 186-file replay vs R779 (`qa/r780-replay.mts`): 184 identical; the 2
  changes are canva-2 (PDF and its extracted text): `projects` 4 → 0, the six
  lines stay in `EXTRACURRICULAR ACTIVITIES` with their neighbours.
- `npm test`: 118 tests; the R780 rule test fails on the R779 parser and
  passes here; the compound-heading test passes on both.
- `tsc -b` / eslint / build / verify-dist; deploy; production QA at 1280 and
  375 through `/ats-checker` → builder with canva-2 and the R763–R779
  regression files.
