# R799 — the section order an export prints survives re-import

## Benchmark refresh (first-hand, `~/qa/r799-rezi.mjs`, production probe)

- Rezi public pages (8 routes): 7 × HTTP 200, `/resume-keyword-scanner` 404 —
  titles, headings and byte lengths identical to the R793 capture. No new
  public gap.
- Production: `/`, `/builder`, `/ats-checker`, `/jobs`, `/dashboard`,
  `/documents`, `/templates/`, `/examples/` 200, `/pricing` 307,
  `/api/jobs/search?q=nurse` 28 rows with `arbeitnow` / `jobicy` attribution.
- P1 chosen from our own closed loop: five rounds (R793–R798) made the
  export → import round trip faithful field for field, but the **order of the
  sections** — a first-class Builder feature ("Section order" list with drag /
  Move up / Move down / Apply recommended order; Rezi has the same control) —
  was still lost on every import.

## Evidence (first-hand, `qa/r799-evidence.mts`, `qa/r799-parse-replay.mts`, `qa/r799-order-audit.mts`)

The R797 fixture reordered to Skills / Education / Certifications /
Volunteering (custom) / Projects / Involvement / Summary / Experience / Awards
prints, in every format, the headings

```
SKILLS · EDUCATION · COURSEWORK · CERTIFICATIONS · VOLUNTEERING · INVOLVEMENT ·
SUMMARY · EXPERIENCE · AWARDS & HONORS · PUBLICATIONS · REFERENCES · MILITARY SERVICE
```

(the sections the order leaves out fall in behind their canonical neighbour via
`orderedSectionKeys`; the empty Projects section is not printed). Re-imported
with the R798 parser (TXT = MD = Modern PDF = DOCX):

```
summary > experience > involvement > education > coursework > skills >
certifications > awards > publications > references > military > custom:volunteering
```

i.e. the canonical order with the custom section appended — `parseResumeText`
starts from `emptyResume()` and never touches `sectionOrder`, so a skills-first
résumé (Canva, Pages, Word templates in the corpus print Skills before
Experience; 11 distinct documents in the 186-file replay corpus are not in
canonical order) opens in the
Builder as summary-first and the user has to rebuild the order by hand; a
Builder "Import" of your own export silently undoes the order you set.

## Options considered

- **Copy `sectionOrder` from the replaced résumé** (the R795 design-field
  approach) — wrong for someone else's file, and useless for the Dashboard /
  first-visit paths where there is nothing to copy. Rejected.
- **Only reorder for our own exports** (detect product headings) — the order
  is visible in every résumé, not just ours; Canva / Word skills-first files
  benefit the same way. Rejected.
- **Record the heading encounter order** (chosen) — the state machine already
  knows when it opens a section (`matchHeading` / `matchInlineHeading` /
  `matchGutterLabel` / `openCustom`); note the key the first time each is
  opened, and normalise with the product's own `orderedSectionKeys` so the
  sections the document does not print fall in exactly where the exporters
  would put them (a second export prints the same heading sequence). A file
  with no recognised heading notes nothing and keeps the default order.

## Fix (`src/lib/importText.ts`)

- `headingOrder: string[]` + `noteSection(key)` in `parseResumeTextInner`;
  called when a heading opens a parser section and when `openCustom` opens a
  custom section (`custom:<id>`), gutter labels included.
- `liftOwnSections(resume, customRaw, headingOrder)`: when a custom section is
  lifted into its structured field (R797), its `custom:<id>` slot in
  `headingOrder` becomes the structured key, so a lifted Involvement keeps the
  place its heading had.
- Finalisation: `resume.sectionOrder = orderedSectionKeys({ ...resume, sectionOrder: headingOrder })`.
- No change to heading recognition, content parsing, ATS scoring or exports.

## Tests (`npm test` 205 → 212)

- `tests/import/ownSections.ts`: shared `reorderedOwnSections` fixture,
  `PRINTED_ORDER`, `printedOrder()` (custom sections by lower-cased title —
  a TXT export prints the title in capitals and the parser keeps the document's
  casing for a user heading, R789 canonicalises product headings only).
- `tests/import/rules.test.ts` (R799 block): TXT and MD re-import in print
  order with the seven structured sections still lifted; renamed headings
  (R796 hint) keep their position; an education-first plain résumé with an
  inline `Technical Skills:` label and a `VOLUNTEER EXPERIENCE` custom section
  keeps that order with absent sections behind their canonical neighbour; a
  résumé with no recognised heading keeps the default order (two shapes).
- `tests/pdf.test.ts`: the reordered fixture re-imports in print order from
  all 24 full-width templates; `tests/docx.test.ts`: from DOCX.
- `tests/import/helpers.ts` `normalize`: `sectionOrder` names a custom section
  by title instead of its generated id (ids were already stripped everywhere
  else; before R799 `sectionOrder` never contained one).
- Goldens: 3 of 109 change, all `sectionOrder` only — `synth-project-manager`
  and `synth-skills-grid` print Skills before Experience, `synth-sidebar`'s
  CONTACT / LANGUAGES / INTERESTS custom sections take their column positions.

## Replay (186 files vs the R798 parser byte copy)

`same 165 / 186; changed 21; changed only in sectionOrder: 21 / 21` — 11
distinct documents (PDF + its `.pdfjs.txt` twin each): canva-1/-2, Pages
(Sumit), Word CU / UFL / Stony Brook / table, Google Docs sheets, Chrome print
(ronstr8), synth project-manager / skills-grid / sidebar. Each was read against
its headings — e.g. Sumit `SUMMARY · SKILLS · EXPERIENCE · PROJECTS · TECHNICAL
WRITING · EDUCATION` → `summary > skills > … > experience > projects >
involvement > custom > education > coursework`; Stony Brook `EDUCATION ·
EXPERIENCE · VOLUNTEER EXPERIENCE · SKILLS` → `summary > education > coursework
> experience > projects > involvement > custom > skills > …`. The empty
sections a document does not print sit behind their canonical neighbour (the
same placement the exporters use), so they are never printed and the Builder's
"Section order" list shows them where "Apply recommended order" would.

## Boundaries

- The Builder editor forms are fixed-order; only the "Section order" list,
  preview and exports follow `sectionOrder`.
- A résumé whose only section cue is an inline label the parser does not
  recognise keeps the default order.
- Sidebar-template full-section PDFs remain excluded from the template test
  (R797 extractor boundary).
