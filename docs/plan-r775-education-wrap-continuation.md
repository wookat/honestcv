# R775 — a wrapped line under a school is the rest of that line, not a new school

Chain: R773 (#991) → R774 (#992) → this PR. Scope: `src/lib/importText.ts`, Education branch of
`parseResumeText` only.

## Evidence (first-hand)

R774's production QA replayed `r771-ox.pdf` (the R771-era PDF export of the Oxford Careers Service
DOCX) and got 7 experiences / **3** education rows where the DOCX gives 7 / 2. Extracted text
(byte-identical at R773 and R774 — this is the parser, not the extractor):

```
39: Grade: Passed with a 2:1 in first year exams; Modules: Multicellularity and Cell Signalling; Chemistry of Metabolism;
40: Proteins; Quantum Mechanics; Crankstart Scholar (widening participation bursary for students from a low socio-economic
41: background)
42: Degree · St Mary's High School
```

Line 40 is kept as a detail because it names `Scholar` / `bursary` (`EDU_DETAIL_RE`); line 41 names
nothing, so the fall-through opens a school whose degree is `background)`. The editor then shows a
third education card with that word; PDF / DOCX / share print it (R771 prints a bare head as-is).

The same shape in the retained 114-text corpus (R774 replay `r774-text-replay.json`, 136 education
rows scanned for a lowercase-led or unbalanced-`)` degree / school): 8 rows in 4 files.

| file | previous line (detail) | line that opened a row |
|---|---|---|
| `word365-ufl` | `Relevant Coursework: List 4-6 classes relating to career goals/that help you stand out from other` | `applicants` |
| `word-table` | `First Class Honours. Final project: an accessible` | `public transport journey planner.` |
| `word-mac-quartz-stonybrook` | `EDUCATION` (first line) | `Current major or if undeclared, major of interest` — template prose, not a wrap |
| `canva-3` (×5) | interleaved two-column stream (R746 known-unreliable) | body lines of the other column |

So three real files (Oxford PDF, the UF template, the Word-table CV) wrap an education detail across
two extracted lines and the second line opens a bare school row. The Experience and custom-section
branches already handle this exact shape with `continuesPrevious(prev, line)` (R746: a marker-less
line starting in lowercase / a figure after a line with no terminal punctuation, or any marker-less
line after a line that ends mid-phrase) — Education never called it.

## Plan

In the Education branch, before the fall-through that opens a school:

```ts
} else if (currentEdu && !start && continuesPrevious(prevLine, line)) {
  // "… from a low socio-economic" + "background)" — the rest of the previous line
  continueEduLine(currentEdu, prevLine, line)
}
```

`continueEduLine` appends `' ' + line` to whichever of `details` / `degree` / `school` ends with the
previous line's text (so a wrapped detail stays one detail, a wrapped degree stays one degree) and
falls back to `appendDetails` (`; `-joined) when none does. `prevLine` is the previous non-empty
input line. No new vocabulary; `continuesPrevious` is reused unchanged (it already refuses lines that
open with a year or carry a date range, so a dated school line under a detail is still a school).

Rejected: a parenthesis-balance rule alone (covers `background)` but not `applicants` /
`public transport journey planner.`); widening `EDU_DETAIL_RE` (the wrapped tail can be any word).

## Validation

- 114-text replay vs R774 (`qa/r768-replay.mts`), every changed file read line by line.
- Oxford PDF (`r771-ox.pdf`) → 7 / 2, second row's details end `… socio-economic background)`.
- Oxford DOCX unchanged (7 / 2); Alex, northstar controls unchanged.
- Gates: tsc app + worker, eslint, build, verify-dist.
- Deploy; production QA 1280 + 375 on `/ats-checker` → builder for the Oxford PDF, UF template and
  Alex control (no AI, no downloads / shares / copies).

## Results

- Implemented as planned plus one fail-closed guard: the previous line must have text left after
  `extractDates` (a bare `2008` line is never continued — canva-3 showed the shape).
- 114-text replay vs R774: **111 / 114 byte-identical**. Changed files read line by line:
  - `word365-ufl` 3 → 2 rows — `applicants` joined onto the coursework detail (correction);
  - `word-table` 2 → 1 row — `public transport journey planner.` joined onto the honours detail
    (correction);
  - `canva-3` 13 → 9 rows — R746 known-unreliable interleaved stream, body lines of the other column
    now join each other instead of opening rows (neutral residue; experience unchanged).
- `r771-ox.pdf`: 7 / **2**, first entry's details end `… from a low socio-economic background)`.
- Oxford DOCX through `extractResumeFile`: byte-identical (7 / 2).
- Gates: tsc app + worker, eslint, build, verify-dist green.

## Deployment and production QA

- `npm run deploy` uploaded 30 assets + the worker; Workers Routes listing failed with `code 10000`
  as in every round (token permission; upload unaffected).
- Production `index-Bfpr1SyW.js` + `importText-DZNuRLIV.js` SHA-256 identical to local `dist`; the
  minified chunk contains the `continueEduLine` loop.
- Testing agent, cache disabled, 1280×800 + 375×667, six `/ats-checker` → Check → builder journeys
  (results `/home/ubuntu/qa/r775-results.json`, recording
  `/home/ubuntu/screencasts/r775-education-continuation/r775-education-continuation-edited.mp4`):
  - Oxford PDF 7 / 2, second school `St Mary’s High School`, first Details ends
    `socio-economic background)`, no `background)` row; all seven experience objects equal R774;
    `A*` literal, 0 `<em>`.
  - UFL 2 rows, second row's Details ends `… stand out from other applicants`; word-table 1 row,
    Details `First Class Honours. Final project: an accessible public transport journey planner.`
  - Controls: Kenneth LinkedIn 22 / 5 with every normalised field equal to R774 (5 certifications,
    5 publications); Alex 2 / 1 equal to R773; Oxford DOCX 7 / 2 equal to R773.
  - Layout: page and every education card scrollWidth = clientWidth at both widths (1265 / 360;
    cards 569 / 292); mobile Details full row width (268 px) with the buttons below (R767 layout);
    long values scroll inside the single-line input (Home/End reach both ends).
  - 0 console errors, 0 HTTP ≥ 400, 0 AI POSTs, 0 downloads / shares / copies / payments / lead
    submissions; 15 automatic `GET /api/ai/quota` reads; storage restored byte-for-byte after each
    import. One harness-origin CSP `unsafe-eval` pageerror from a Playwright `waitForFunction` was
    replaced by input polling and is not an application error.
- Untested: mobile-initiated upload, exports / shares of these fixtures.

## Boundaries

- Reuses `continuesPrevious` — English open-phrase list, lowercase / figure start; a wrapped line that
  starts with a capitalised word after a line ending in a complete phrase still opens a row.
- Education branch of the generic parser only; the LinkedIn parser has its own wrap rules (R773).
- Template residue in canva-3 / UFL / word-table is joined, not classified — those files are still
  recorded as unreliable.
