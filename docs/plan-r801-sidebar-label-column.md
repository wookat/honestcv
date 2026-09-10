# R801 — a Sidebar export's label column reads with its sections on import

## Source

Tracked since R797 as an extractor boundary (`tests/pdf.test.ts` excluded the
Sidebar template from the structured-section round trip): the Sidebar
template prints every section heading in a narrow label column beside its
content. With the seven structured sections the export carries ten labels,
and the PDF extractor read the page as two text columns — the whole body
first, then the ten labels — so the re-import found no heading before any
section. Rezi's own exports re-import into their sections on every template.

## Evidence (first-hand, `qa/r801-sidebar.mts`, `qa/r801-geom.mts`)

- `withOwnSections(sampleResume())` → Sidebar PDF → production extraction
  (`pdfTextOf`) → `parseResumeText` on R800: `multiColumn: true`; extracted
  text = summary prose, both jobs, education, skills, …, then `SUMMARY`,
  `EXPERIENCE`, `INVOLVEMENT`, `EDUCATION`, `COURSEWORK`, `SKILLS`,
  `CERTIFICATIONS`, `AWARDS & HONORS`, `PUBLICATIONS`, `REFERENCES` as ten
  trailing lines. Parsed: name `React, TypeScript and cloud infrastructure.`,
  one blank experience, only `military` reconstructed, five empty custom
  sections, 0 skills, no summary.
- The plain sample (five sections) on Sidebar re-imports correctly: too few
  label rows for `columnLayout` to see a column.
- Geometry: labels at x ≈ 54 (the page margin), content at x ≈ 150, dates
  right-aligned at x ≈ 480–538; 2 pages. `columnLayout` finds the gutter at
  the content x, both sides carry worded lines on most rows of the band, the
  band covers more than half the page → `sidebar: true` → main column then
  `unwrapSidebar(labels)`.
- No-name paste (`qa/_r801probe.mts`) was the other candidate: a paste
  without a name line takes `Jan 2020` / `Senior Engineer · Acme Corp` / the
  summary sentence as `fullName` and blanks the first job. Real corpus
  replay (186) found only two placeholder Word files with `Y O U R N A M E`;
  the Sidebar defect is our own export and reproducible on every full
  résumé, so it goes first; the no-name header detection is queued for R802.

## Options considered

- **Emit the narrower column first when it is a sidebar** — LinkedIn's
  Save-to-PDF sidebar (Contact / Top Skills / Languages / Certifications with
  their items) is a real second column that must stay after the body (R773 /
  R774). Rejected.
- **Special-case our template** — the extractor cannot know the file came
  from Sidebar; a Word or Canva résumé with hanging labels has the same
  shape. Rejected.
- **A column made mostly of section labels is not a text column** (chosen)
  — `columnLayout` already refuses a band whose side is mostly dates
  (`dateHeavy`); the same test on section labels lets the label rows fall
  back to the ordinary in-order reading, where each label precedes its
  section (the split at the gutter still happens per line, R776 / R781).

## Fix

- `src/lib/extractFile.ts`: `isSectionLabel(text)` — heading-shaped
  (`looksLikeHeadingShape`, shared with the importer / ATS via
  `sectionWords.ts`), ≥ 3 letters, and either fully upper-case, a core
  section word (`sectionNamedByHeading`) or a custom heading word
  (`CUSTOM_HEADING_RE`). `columnLayout` skips a band whose left or right side
  is more than half section labels (`labelHeavy`), next to `dateHeavy`.
- Nothing else changes: gutter detection, the skills-grid path, LinkedIn
  sidebar parking and unwrapping, bullet rejoining, the importer.

## Tests (`tests/pdf.test.ts`, 220 → 221)

- R797 / R799 template loops run on all 25 templates (Sidebar exclusion
  removed) — both failed on the R800 extractor for `sidebar`.
- New: Sidebar full-section export → `multiColumn: false`; `EXPERIENCE` /
  `EDUCATION` / `REFERENCES` are each immediately followed by their first
  content line; parsed name, both jobs with 3 bullets, skills and summary
  equal the source. Fails on the R800 extractor (`expected true to be false`).

## Replay

- 72 retained PDFs (`qa/r801-replay.mts`, R800 extractor byte copy vs
  branch): 72 / 72 byte-identical text and `multiColumn` — LinkedIn exports,
  the Pages two-column résumé (R764), the skills grid (R777), synth-sidebar
  and Chrome's Sidebar copy (R781) all unchanged.

## Boundaries

- A real sidebar whose rows are more than half heading-shaped capitals
  (e.g. an all-caps acronym skills list with no other text) would now be
  read in line order; none of the 72 retained PDFs has that shape.
- The ATS "single-column layout" file check now passes for a full Sidebar
  export (it failed only because the label column was mistaken for a text
  column; the plain sample already passed).
