# R746 — PDF import: layout gaps in ems, Word bullets, wrapped headers

## Evidence (first-hand, `qa/r746-*.mts`, no AI calls)

Corpus: the Northstar fixture and the built-in sample exported through every
template with `buildResumePdf` (52 PDFs), the ReportLab fixture used since
R703, and three Word-style resumes (tab-aligned dates, justified prose, a
`label | content` table) written with `docx` and rendered by LibreOffice.
Every PDF was pushed through the browser importer's own text assembly
(`pdfPageText`, previously inlined in `extractPdf`) and `parseResumeText`,
then compared with the source resume.

| finding | where | before |
| --- | --- | --- |
| Segment split threshold was 40pt absolute. The Sidebar template's label column sits 37–40pt from its content at 9–10pt type, so `EDUCATION` glued onto `BSc Computer Science …`; the education block became a third job (`Sep 2017` / `Jun 2020`) and the education list was empty. | `extractFile.ts` | 1 of 26 templates: exp 2→3, edu 1→0 |
| Word's default list glyph `●` (U+25CF) is not a bullet marker. Every bullet imported as `● Led a React …`, so a re-export renders `• ● Led …`. | `importText.ts` | word-plain: 6/6 bullets carry the marker |
| A wrapped bullet whose second visual line starts with a figure (`from` ⏎ `3.2 seconds to 1.8 seconds.`) split into two bullets. | `importText.ts` | sidebar / narrow columns: 6→7 bullets |
| A long header that wraps after the company's trailing comma (`Senior … · Northstar Digital,` ⏎ `London, UK`) made `London` a role with company `UK`; the second such header (>60 chars) was filed as a description line. | `importText.ts` | word-longtitle: exp 2→3, roles wrong |

Gap measurements (`qa/r746-gaps.mts`, adjacent text items on one line, in
ems of the following item):

- own templates — inside text ≤ 0.85em, contact separators 1.2–1.4em,
  layout gaps (label→content, header→right-aligned date) ≥ 3.7em;
- LibreOffice/Word — justified word gaps ≤ 1.2em, bullet glyph→text 1.1em,
  layout gaps ≥ 11.6em.

A relative threshold of 2.5em sits ≥1.8× above the widest in-text gap and
≤0.68× the narrowest layout gap in the corpus.

## Change

- `extractFile.ts`: the page text assembly is a pure exported function
  `pdfPageText(items)`; segments split when the gap exceeds
  `2.5 × max(size of the two items)` instead of 40pt.
- `importText.ts`: `BULLET_MARK_RE` adds ● ○ ■ □ ▫ ◆ ◇ ❖ ➢ ➤ ► ▶ ✓ ✔ → and a
  lone Private Use Area glyph (Symbol-font bullets); `continuesPrevious`
  accepts a digit-leading continuation unless the line opens with a year or a
  date range; a header with a trailing comma takes the next short line as its
  location (and dates, if they sit there); a `Role · Company,` line up to 120
  chars is a wrapped header rather than a description line.

## Result (same corpus, after)

- 52/52 own-template PDFs and the ReportLab fixture: experience, bullet,
  education counts and every bullet text match the source (name casing
  follows the template; skills follow the fixture's single-line skills).
- word-plain: 6/6 bullets without markers; word-longtitle: 2 roles, 6 bullets,
  location `London, UK` on both.
- Not fixed: the `label | content` table layout whose section labels carry
  paragraph spacing renders each label one line below the row's first text
  line, so headings arrive after their first content line (word-table: 3
  jobs, 3 education entries). That needs heading detection independent of
  line order and is out of scope here.

## Limits

- Threshold and glyph list come from this corpus (26 templates, one Word
  toolchain via LibreOffice); real Word/Google Docs PDFs were not sampled.
- A digit-leading description line under a bullet that lacks terminal
  punctuation now joins that bullet.
