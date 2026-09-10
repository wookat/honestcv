# R805 — a section heading ends the name scan; a document title over the name is neither name nor title

## Source

R804 production QA (Builder Import paste and ATS paste → Replace, both
widths): 564 assertions, 4 failed, all four the same shape and all reproduced
on the R803 parser — a fragment pasted from `EDUCATION` down:

```
EDUCATION
State University
BS Computer Science
2016
GPA: 3.8
```

stored `contact.fullName = 'State University'` and `education[0].school = ''`.
The Builder shows the school in the Name field, every template prints it as
the name, the share title / TXT header / letter sign-off use it, and the
education card has no school.

R802 made the name scan stop at the first **body** line (a bullet, a date, an
entry header over a date) but a section heading is not a body line, and the
scan's `!matchHeading(line)` guard only skipped the heading itself — the very
next line (`State University`, or a summary sentence under `SUMMARY`) was
still a candidate.

Evidence (`qa/r805-evidence.mts`, R804 parser vs this branch):

| shape | R804 | R805 |
| --- | --- | --- |
| `EDUCATION` / `State University` / `BS Computer Science` / `2016` / `GPA: 3.8` | name `State University`, school `''` | name `''`, school `State University` |
| `email · phone` / `EDUCATION` / school / degree / year | name `State University`, school `''` | name `''`, school kept |
| `SUMMARY` / `Seasoned engineer.` / `EXPERIENCE` / … | name `Seasoned engineer.`, summary `''` | name `''`, summary `Seasoned engineer.` |
| `EXPERIENCE` / `Senior Engineer · Acme Corp` / dates | already correct (R802 header stop) | unchanged |
| `EXPERIENCE Senior Engineer · Acme Corp` (gutter label) / dates | already correct | unchanged |
| `Jane Doe` / `EDUCATION` / … | correct | unchanged |
| `CURRICULUM VITAE` / `Jane Doe` / email / … | name `Curriculum Vitae`, **title `Jane Doe`** | name `Jane Doe`, title `''` |
| `PERSONAL DETAILS` / `Jane Doe` / `Senior Engineer` / contact | name `Personal Details`, title `Jane Doe` | name `Jane Doe`, title `Senior Engineer` |

The last two rows are the same scan reading a document title as the name:
`Curriculum Vitae` / `Résumé` / `Personal Details` over the name is a common
European CV shape. Retained corpus (`qa/_r805top.mts`, 186 texts, first five
lines): 0 files carry such a title line, so this part is paste-path closure,
not corpus repair.

## Options considered

1. **Stop the name scan at a section heading** (chosen). `matchHeading(line)`
   or `matchGutterLabel(line)` → `break`: nothing below a heading is the
   name. The heading vocabulary is the one the parser already uses to open
   sections (standard + R789 own headings + R796 renamed labels + R800 `##`),
   so the stop is exactly where the body's sections start. A heading on the
   very first line stops the scan immediately (the fragment has no name).
2. Require `NAME_HEAD_RE` for the name — rejected in R802 already (kills
   mononyms, suffixes, non-Latin names).
3. Blacklist school / degree words in the name scan — the same line shape is a
   legitimate employer or school in a `Name` position only by accident;
   a vocabulary blacklist would miss `Tech Institute` and hit `Stanford Lee`.
4. Skip document-title lines (chosen, narrow): `DOC_TITLE_RE` =
   `curriculum vitae | cv | résumé / resume | personal details / information`,
   whole line, optional colon, any case. The name scan `continue`s past it
   (like the R802 place-line skip) and the header default branch drops it, so
   it is neither name nor title. Not extended to `Profile` / `Contact` /
   `About me` — those are section headings and now end the scan.

## Proof

- `tests/import/rules.test.ts` `R805`: fragment shapes above + gutter label +
  name-above-heading guard + `CURRICULUM VITAE` / `Personal Details` over the
  name. Fails on the R804 parser (`expected { name: 'State University', …} to
  deeply equal { name: '' …}`), passes on this branch.
- Replay 186 retained texts vs R804 byte copy (`qa/r805-parse-replay.mts`):
  **186 / 186 identical** — no real file's name sits under a heading or under
  a document title.
- Gates: tsc ×3 / eslint / vitest 227 / build / verify-dist green.

## Boundaries

- A summary paragraph with no heading and no name above it is still the title
  when ≤ 60 chars (pre-existing, R802).
- `Jane Doe | Senior Engineer` still stores whole as the name (queued since
  R802).
- A document title in another product language (`Lebenslauf`, `Currículum`)
  is not in `DOC_TITLE_RE`; extend when a corpus file shows it.
