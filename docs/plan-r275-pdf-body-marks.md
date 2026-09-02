# R275 — Render inline marks in every PDF body-text field

## Evidence (research first)

R274 production QA (real UI download on cv.zalize.com, bundle `index-D3MVC8jX.js`)
found the PDF export renders `skills = "SQL basics, __SQL__ advanced, React"` with a
literal `__SQL__` (pdftotext), while DOCX renders a real underline run and the live
preview renders every field through `MarkedText`/`InlineText` (all `InlineRun`-aware).

Root cause: R272 added the `hasInlineMarks → richText` gate only to the summary call
site in `pdf.ts`. Every other body-text call site still uses plain `w.text`, drawing
mark tokens literally:

| field | call site | DOCX parity | preview parity |
|---|---|---|---|
| skills (plain line) | `w.text(line.text)` | `body()` parses marks | marks render |
| skills (labelled line) | `w.labelledLine(label, text)` | plain `TextRun` — same bug | marks render |
| project description | `w.text(p.description…)` | `body()` | marks render |
| education detail | `w.text(detail)` | `body()` | marks render |
| certification description | `w.text(c.description…)` | `body()` | marks render |
| certifications free text | `w.text(resume.certifications…)` | `body()` | marks render |
| reference detail | `w.text(detail)` | `body()` | marks render |

Confirmed locally via `.tmp-smoke/r275_oracle.ts` (buildResumePdf + pdftotext) before
the fix: literal `__`/`**` extracted for each field above.

Out of scope (kept as-is, documented):
- `companyInfo` renders at 9pt italic soft — richText would change size/color/font;
  marks there degrade gracefully in preview too rarely used; candidate for later.
- headings/title lines (role, degree, entry headers) are identity fields, not
  mark-bearing body text — preview also renders them bold already.
- Cover letter / interview brief PDFs (plain text documents; TXT-like semantics).

## Fix

`pdf.ts` — one section-body helper inside `composeResumePdf`:

```ts
const bodyText = (t: string) => {
  if (hasInlineMarks(t)) w.richText(t)
  else w.text(t, { size: 10 })
}
```

- Replace the seven `w.text(x, { size: 10 })` body call sites above (incl. summary,
  now folded into the same helper) with `bodyText(x)`.
- Labelled skills line: when `hasInlineMarks(line.text)`,
  `w.richText(`**${line.label}:** ${line.text}`)` — bold prefix via the mark parser,
  wrap geometry matches labelledLine's continuation-at-margin behavior; the mark-free
  path keeps `labelledLine` byte-identical.

`docx.ts` — labelled skills line: replace the plain rest `TextRun` with the same
`parseInlineMarks` run mapping `body()` uses (bold label run unchanged).

Mark-free resumes are byte-identical on every path (`hasInlineMarks` gate).

## Validation

- `.tmp-smoke/r275_oracle.ts`: build PDF with marks in each field → pdftotext has
  zero `__` / `**` / `[](…)` residue and the plain words present; mark-free sample
  resume byte-identical pre/post (compare saved bytes); DOCX labelled skills line
  produces `w:u` run.
- lint / tsc / build.
- Deploy; testing-agent production QA: real UI PDF download with marked skills
  (plain + labelled), project description, education detail; underline pixel check;
  DOCX labelled skills; MD/TXT regression; R272 summary regression; zero AI calls;
  localStorage/theme restore.
