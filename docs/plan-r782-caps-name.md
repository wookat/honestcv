# R782 — an imported name printed in capitals ("ALEX MORGAN") is stored as a name, not as its typography

## Evidence (first-hand, before any code)

1. **Where it came from.** Reading the R780/R781 goldens as a *set* for the
   first time (not one file at a time): the 25 Northstar and 25 sample template
   exports parse to the same contact block except for four templates —
   `bold`, `cobalt`, `corporate`, `ink` — whose `contact.fullName` is
   `ALEX MORGAN` / `JORDAN REYES` in both the PDF and the text golden. Those are
   exactly the four templates with `nameCase: 'upper'` in `src/lib/templates.ts`
   (`pdf.ts:771`, `docx.ts:201` apply `toUpperCase()` at draw time). The
   resume the user exported says `Alex Morgan`; only the template shouts.

2. **Corpus scan** (`qa/r782-scan.mts`, 114 retained texts + 72 PDF
   extractions, 184 with a name): **28 / 184** files parse to an ALL-CAPS name.
   - 24 — our own `nameCase: 'upper'` templates (4 templates × Northstar/sample
     × PDF/text).
   - 2 — a real Apple Pages résumé (`pages-mac-sumit`), name set in capitals by
     the Pages template.
   - 2 — the Word/UFL placeholder template (`FIRST NAME LAST NAME`).
   Every other field was checked the same way (title / role / company / degree /
   school, multi-word to skip acronyms): **0** hits outside the letter-spaced
   `Y O U R N A M E` placeholder of `word-cu`. The name is the only field
   templates print in capitals, so the fix is a name rule, not a general one.

3. **What the stored capitals do downstream** (code read, each site used by the
   product today):
   - the 21 `nameCase: 'normal'` templates, the editable/read-only preview,
     `/s/:id` and the dashboard thumbnails print `ALEX MORGAN` — the user chose a
     normal-case template and gets a shouted name;
   - TXT (`resume.ts:2771`) and Markdown (`:2889`) headers: `ALEX MORGAN — Software Engineer`;
   - `/s/:id` document title and description (`SharedResume.tsx:26-32`):
     `ALEX MORGAN — Software Engineer | RezUp`, `ALEX MORGAN's resume, shared with you`;
   - cover-letter / resignation sign-off (`letterExamples.ts:40`) and the
     follow-up e-mail sign-off (`Jobs.tsx:2602`);
   - the default copy name when a job saves a targeted copy without a target
     role (`Jobs.tsx:975`);
   - every AI prompt that sends the resume text (cover letter, brief, tailor)
     sees the capitals as the candidate's name.
   Export file names are unaffected (`professionalFileName` lower-cases).

4. **Round trip is a product path.** Export with Bold → open the PDF → import
   it (or copy-paste) into the ATS checker or a new copy is exactly the
   "re-import your own résumé" flow the landing page advertises, and the Pages
   file shows real CVs do the same.

## Design

One function in the parser, applied where the name is first read
(`parseResumeText` header pass; `parseLinkedInText` header[0] for symmetry):

```
humanNameCase(name):
  if name has no letters, or is not entirely upper-case          → unchanged
  if it has fewer than 4 letters                                 → unchanged  ("LI", "AJ")
  for each whitespace-separated token (whitespace preserved):
    II / III / IV                                                → unchanged
    single initial  "J" / "J."                                   → unchanged
    name particle after the first token (de, van, von, der, da,
      la, le, di, del, della, du, den, bin, ibn, al, el, y, e)   → lower-case
    otherwise every letter run inside the token (split on ' ’ -) → First + rest lower,
      with "MC" + letter → "Mc" + Letter
```

`ALEX MORGAN` → `Alex Morgan`; `SUMIT YADAV` → `Sumit Yadav`;
`MARY-JANE O'NEIL` → `Mary-Jane O'Neil`; `LUDWIG VAN BEETHOVEN` →
`Ludwig van Beethoven`; `JOHN SMITH III` → `John Smith III`;
`J.R.R. TOLKIEN` → `J.R.R. Tolkien`; `MCDONALD` → `McDonald`.
Mixed-case names (`Alex Morgan`, `alex morgan`, `MacKenzie`) are untouched:
the rule fires only when *every* letter is upper-case, i.e. when the case
carries no information about the name.

The raw header line is still what the body loop skips
(`if (line === nameLine) continue`), so the recased name does not leak the
line into the summary.

Not done, on purpose:
- No change in the editor / `sanitizeResume` — a name the user typed in
  capitals is the user's choice; only *imported* typography is undone.
- No title / company / school recasing — 0 corpus hits; acronyms (IBM, NASA,
  CEO) are legitimately all-caps there.
- `FIRST NAME LAST NAME` becomes `First Name Last Name` — still a placeholder,
  reads the same to the user, not treated specially.
- Roman numerals beyond IV, and Scottish `MAC…` (`MACINTOSH` vs `MacDonald` is
  undecidable) → plain `Macdonald`; recorded as a boundary.

## Validation plan

- `tests/import/rules.test.ts`: R782 cases (upper template header → recased;
  mixed-case header untouched; hyphen / apostrophe / particle / numeral /
  initials; short all-caps name untouched).
- Goldens: the 24 `bold/cobalt/corporate/ink` files change in
  `contact.fullName` only — reviewed as a diff before `-u`.
- Replay 186 files R781 parser vs branch: expected 28 changed, each in
  `contact.fullName` only.
- Local gates: tsc (app / worker / test), eslint, build, verify-dist, `npm test`.
- Production QA (1280 + 375, cache off): import our own Bold export (PDF upload,
  Chrome copy/paste, Builder Import dialog) → name `Alex Morgan` in editor,
  read-only preview, `/s/:id` title, TXT download header, cover-letter sign-off
  slot; Classic export unchanged; Sumit PDF → `Sumit Yadav`, rest of the parse
  identical to R781; regression set unchanged.
