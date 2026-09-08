# R784 — the exported PDF drops the contact separators; the location does not survive re-import

## Where it comes from

R783 closed the TXT / Markdown round trip and left DOCX and PDF for this round.

- DOCX (`qa/r783-docx-roundtrip.mts`, 25 templates × Northstar / sample → production
  `extractResumeFile → parseResumeText`): **0 field differences** against the TXT
  re-import for all 50 files. The script's `same 0 / 50` line counts the extractor's
  `Professional file name` check as a failure because the harness saves the file as
  `x.docx`; the real download is named from the user's name. Not a defect — the
  script now reports field parity and file-quality checks separately.
- PDF (`/home/ubuntu/qa/r784-pdf-fidelity.mts`: the R780 goldens of our own 25-template
  exports compared field by field with the source resume): **15 / 51 identical**.
  - 25 / 25 **sample** exports: `contact.location` `"Austin, TX"` → `""`. Everything
    else identical.
  - 11 / 25 Northstar exports: the fixture's `skills` is one flattened line
    (`Languages: …, Frontend: …, Testing and tools: …`, an artefact of a pre-R714
    import) and the PDF wraps it at the template's line width, so the re-import
    splits it at the wrapped label. The source is the artefact; queued (R782 SOP-04
    "旧导入压平的技能行").

## Evidence for the location loss

pdf.js text layer of `sample-classic.pdf` (golden `tests/import/golden/pdf/sample-classic.pdf.txt`):

```
Jordan Reyes
Software Engineer
jordan.reyes@email.com (555) 210-4432 Austin, TX linkedin.com/in/jordanreyes
```

Northstar, same template:

```
alex.morgan@example.com | +44 7700 900123 | London, UK | github.com/alexmorgan-example | linkedin.com/in/alexmorgan-example
```

Rendered page (`pdftoppm`, `/home/ubuntu/qa/r784-sample-classic-head.png`): the sample's
contact row is four items with white gaps and **no bars** between them. The preview
(`ResumePreview.tsx`, `'  |  '`) and the DOCX (`docx.ts`, `TextRun '  |  '`) both print
bars.

`src/lib/pdf.ts` `linkLine` (since R47, "clickable contact links in exported PDF"):
when the joined line fits the content width it draws each segment on its own so the
link annotations get their rectangle, reserves `drawnWidth(font, '  |  ')` between
segments — and never draws the separator. Only the overflow fallback (`this.text(full)`)
prints the bars, which is why Northstar's longer line has them and the sample's does not.
Every PDF exported since R47 whose contact row fits on one line (the common case) has
looked like this.

Parser side (`importText.ts`, location): header lines are split on `| • ·` and a
segment must be exactly `City, ST`. With no separator the whole row is one segment and
nothing matches; the fallback (`isExpPlaceLine` on its own line) does not apply.

## Change

1. `pdf.ts` `linkLine`: draw `'  |  '` between segments in the non-icon layout, same
   font / size / colour as the segments, at the position whose width was already
   reserved. Icon layout unchanged (icons are the separators). Layout metrics
   unchanged, so page breaks and the length meter do not move.
2. `importText.ts` location: when a header segment is not `City, ST` as a whole, remove
   its e-mail / phone / URL tokens and test the remainder (`Austin, TX 78701`,
   icon-led rows and every PDF exported before this change re-import their location).
   Only the header window (first 5 lines, before a heading) is affected; the
   `City, ST` shape itself is unchanged.

## Tests

- `tests/pdf.test.ts` (new): `buildResumePdf(sampleResume())` → pdf.js text layer →
  the contact row contains `|` between every pair of items and `parseResumeText`
  returns the source `contact.location`; a 5-item row that overflows still
  re-imports (fallback path).
- `tests/import/rules.test.ts`: separator-less contact row → location; `Austin, TX 78701`.
- PDF fixtures are **not** regenerated: they are what users exported between R47 and
  now and must keep importing; their goldens change only in `contact.location`.

## Rejected

- Regenerating the 51 PDF fixtures with the fixed renderer (loses the pre-fix shape).
- Reading location from icon-led rows by geometry in `extractFile.ts` (the parser rule
  covers it without touching the extractor).
- Any change to the Northstar flattened-skills fixture (source artefact, separate item).
