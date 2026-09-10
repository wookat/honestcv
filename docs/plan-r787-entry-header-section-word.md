# R787 — an entry header that opens with a section word is an entry, not a heading (our own Kenneth re-export)

## Evidence (first-hand, R786 production QA + `qa/r787-*.mts` on the VM)

- Our own R778 re-export of the Kenneth LinkedIn profile
  (`/home/ubuntu/qa/r778-exports/Kenneth-Adams-LinkedIn-Profile-and-Resume.pdf`
  and its `.txt`) re-imports as **1 experience / 5 education / 17.5 k-char
  summary**; the source has 22 experiences and a 717-char summary. Identical on
  the R785 and R786 extractors (score 50 both) and identical for the TXT export,
  so the extractor is not involved: the parser fails on our own export shape.
- Line-by-line trace (`qa/r787-lines.mts`): the second experience header is
  `About Recommendations · Recommendations` (LinkedIn's recommendations block,
  which its "Save to PDF" files as a position). `matchHeading()` strips nothing
  from it, `SECTION_HEADINGS` matches `^(professional\s+)?(summary|profile|objective|about)\b`
  → `summary`, and every following line (20 headers, 130 bullets) is appended
  to `summary` until `Education`.
- The same header is printed three ways by our exporters: PDF `Role · Company`,
  TXT `Role at Company`, MD `### Role — Company`. All three collided.
- Reading the whole re-import once the heading was fixed exposed four more
  own-export shapes that lost data (each traced, none a regression):
  1. `Senior Scrum Master at Adobe, San Jose, CA (2019)` — a same-year tenure
     prints as `(2019)`; `SINGLE_DATE_RE` wants a month, `DATE_RANGE_RE` wants
     two ends, so the entry had no dates and `(2019)` stayed in the company.
     The PDF prints the year alone on the dates line (`2023`), which R768 left
     as "not a date" — correct for a stray year, wrong right under a header.
  2. `Kenneth Adams — Engineering Manager; Agile Leader - … at Apple, IBM & more...`
     — the name line is 150 chars because the LinkedIn headline rides on it;
     the 60-char name rule rejected the whole line, so the name came from the
     next candidate and the title was lost. Our PDF prints the headline on its
     own line under the name and wraps it (`… Program` / `Manager at Apple, IBM & more...`).
  3. `Las Vegas Metropolitan Area` / `Ivanti, San Francisco Bay Area` —
     LinkedIn region labels have no `City, ST` shape; contact location came back
     empty and the region stayed glued to the company.
  4. The PDF wraps a long header *inside* its location:
     `… Agile Transformation & Coaching · Ivanti, San Francisco Bay` / `Area` /
     `2016 – 2018` — the tail `Area` became a bullet-less row, shifting the count.
- Corpus scan for the guard (`qa/r787-scan.mts`, 114 texts + 72 PDF texts): 0
  genuine section headings contain ` · `, ` at ` (lower-case) or ` — ` followed
  by a capital; `SKILLS AT A GLANCE`-style headings are upper-case and untouched.
- Education: the source has `degree: ''`, `school: 'Certified Scrum Professional (CSP)'`
  (LinkedIn certifications imported as education). R771 prints a blank degree as
  the school alone, so the exported line is the bare name and the parser reads
  a lone name as the degree. Same content, inverted field — an exporter shape
  (no marker distinguishes "degree only" from "school only" in a one-name line),
  not a parser defect and not an R787 change. `Engineering, Software & Systems
  Engineering Certifications` round-trips both fields.
- Custom sections: TXT prints titles in capitals (`PUBLICATIONS`), so the title
  comes back `PUBLICATIONS`; MD keeps `Publications`. Bullets identical. Casing
  is exporter normalisation, unchanged since R783.
- Fresh PDF round trip (`qa/r787-pdfroundtrip.mts`, Modern): 22 / 5 / 717 / 57
  equal; 3 bullets differ only where our renderer breaks them across a *page*
  (`… Android and Mobile` / `Optimized Web (MOW) …`) — R786 joins wraps within a
  page by geometry; page-boundary wraps are its documented boundary.

## Root cause

`matchHeading()` runs before any header recognition and keys on the first
word, so a role that *starts* with a section word (`About …`, `Profile …`,
`Summary …`) is a heading regardless of what follows. A section heading never
binds two names with ` · `, ` at ` or ` — `.

## Fix (`src/lib/importText.ts`, narrow)

- `ENTRY_HEADER_BINDER_RE = /\S\s(?:·|at|—)\s[A-Z0-9]/` → `matchHeading()`
  returns null (alongside the job-title / credential guards). `about` stays a
  summary keyword; `About`, `About Me`, `Professional Summary`,
  `OBJECTIVE or PROFESSIONAL SUMMARY` still open the section.
- `TRAILING_YEAR_RE` (`\s\((19|20)\d{2}\)$`) in `extractDates()` as the last
  fallback: rejected after `! ? ;` and after a full stop unless the head ends
  in a known abbreviation (`Cox Automotive Inc. (2018)` yes, `… shipped the
  platform. (2023)` no). `BARE_YEAR_LINE_RE`: a lone year right under a header
  with no dates and no bullets is the entry's dates (R768's "bare year is not
  a date" holds everywhere else).
- Name line: only the part before ` — ` is held to the 60-char / 6-word rule
  (`NAME_HEAD_RE`); a headline on its own line between the name and the
  contact row, or wrapped over two such lines, is the title.
- `REGION_RE` (`… Area|Region|Metropolitan Area`) accepted as a contact
  location and peeled off a company tail. `HEADER_TAIL_RE` + `expHeaderRaw`:
  a ≤ 3-word capitalised line under a dated-less, bullet-less entry rejoins the
  header when the rejoined header yields a location.
- `looksLikeDotHeader` word cap 14 → 18: the wrapped Ivanti / PG&E headers are
  16–17 words; below the cap the header fell to "body line" and the tail rule
  never ran.

## Rejected

- Dropping `about` from the summary words (breaks `About` / `About Me`).
- Reordering heading tables (the line is still not a heading).
- Joining wrapped headers in the extractor (the header is one segment; the
  wrap is a renderer line break with no geometry cue distinct from a new row).
- Exporting a marker for "school-only" education rows (changes every TXT / MD
  export for one field inversion that loses no text).

## Tests

`tests/import/rules.test.ts` + 9 (all fail on the R786 parser except the
heading guard): the three binder forms + `Profile Lead at Acme Corp`; genuine
summary headings; `(2019)` / `Inc. (2018)` / sentence `(2017)`; long
`Name — Headline` with `|` and `·` rows, headline on its own line and wrapped;
region-only contact and company tail; PDF-wrapped header + lone year; a
LinkedIn-shaped synthetic resume through `resumeToPlainText` /
`resumeToMarkdown` with the education inversion and TXT title casing asserted
as the documented normalisation. `tests/pdf.test.ts` + 1: the same resume
through 24 full-width templates re-imports contact / summary / 3 entries
field-equal. `npm test` 150. Goldens unchanged.

## Replay

186-file corpus (114 texts + 72 R786-extractor PDF texts), R786 parser vs this
branch: **184 identical**; the 2 changes are the Sumit Pages CV (PDF + its
pdf.js text) gaining `contact.title = "Lead Software Engineer. Building
intelligent, scalable software systems"` — the tagline line between his name
and contact row, previously dropped (new own-line headline rule). Kenneth TXT /
MD: 22 / 5 / 717 / 57 with contact equal to source; retained PDF 22 / 5 / 717 /
57, one bullet-count difference from a page-boundary wrap.

## Boundaries

- The binder guard needs a capital / digit after the binder and lower-case `at`.
- Sidebar template: its narrow column wraps a 78-char role *before* the ` · `
  (`… Agile Transformation &` / `Coaching · AT&T`); not rejoined — queued.
- Page-boundary bullet wraps in our own PDF (R786 boundary) remain two bullets.
- School-only education rows come back as degree-only (same text).
- `HEADER_TAIL_RE` rejoins at most three capitalised words and only when the
  rejoined header has a location.
