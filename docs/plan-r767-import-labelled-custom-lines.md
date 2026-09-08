# R767 — Import: `Languages: English, German` is a labelled line, not a section heading

## Evidence (all deterministic, deployed `parseResumeText`, zero AI)

- Recorded in R763: `Leadership, Negotiation` under Skills becomes a "Leadership" custom section
  because `CUSTOM_HEADING_RE` (`^(awards?|honors?|…|languages?|interests?|…|leadership|references)\b`)
  is anchored at the start of the line and `matchCustomHeading` accepts any line ≤ 32 chars.
- Harness `qa/r767-custom.mts` (not committed) over the 114 retained extracted texts (R746 54 PDFs
  + R763 externals): 6 lines match the regex, all 6 are real headings (`HONORS`, `ACTIVITIES`,
  `VOLUNTEER EXPERIENCE`, `LEADERSHIP AND INVOLVEMENT`, `AWARDS/HONORS`, `Interests Personal Interests`).
  Two real templates carry `Honors: Dean’s List, Scholarships, Department Awards, etc.` (58 chars) and
  `Honors/Awards: Related to academics in high school` (50 chars) under a school — both kept as the
  school's detail today *only because they are longer than 32 characters*.
- Deterministic probes (deployed code), same résumé with one line added:

  | line | position | today |
  |---|---|---|
  | `Languages: English, Spanish` (27) | Skills | custom section titled `Languages: English, Spanish`, **next skill line swallowed as its bullet** |
  | `Languages: English (C2), German (B1)` (36) | Skills | categorised skill line (R714 behaviour) |
  | `Interests: hiking, chess` (24) | Skills | custom section, next skill line swallowed |
  | `Leadership, Negotiation, Mentoring` (33) | Skills | skills |
  | `Honors: Dean’s List` (19) | after a school | empty custom section titled `Honors: Dean’s List` |
  | `Publications: Doe J. (2021) Paper` | after Education | bogus empty education entry |

  The same content is filed three different ways depending on its character count. R714 made
  `Languages: TypeScript, JavaScript, HTML, CSS` (43 chars) a categorised skill line on purpose; the
  most common human-languages line (`Languages: English, German`) sits under the 32-char cliff and is
  mis-filed, taking the following skills row with it. That is a P1 provenance loss on import.

## Decision

A custom-section word that carries its own list on the same line is a labelled line, never a heading:

- `matchCustomHeading`: a line containing `:`/`,`/`;` followed by content returns null (`AWARDS/HONORS`,
  `Awards & Honors`, `Publications (selected)`, letter-spaced headings unaffected).
- New `matchInlineCustomHeading` (`Label: items`, label ≤ 31 chars and a `CUSTOM_HEADING_RE` word):
  - under **Skills** → not used; the line stays a categorised skill line (R714).
  - under **Education** when the line is an `EDU_DETAIL_RE` detail (`Honors: …`, `GPA`, `Dean's list`) → stays the school's detail.
  - anywhere else → opens the custom section with the label as title and the items as its first bullet
    (`Languages` / `English, Spanish`), so nothing lands in a title and nothing is swallowed.
- LinkedIn path: same `[:,;]` guard on its custom-heading test.

Rejected: raising/removing the 32-char cap (the cliff moves, the shape is the problem); treating every
`Label: items` line as skills regardless of section (a `Publications:` line after Education is not a skill).

## Local measurement

- 114 retained extracted texts: 113 byte-identical parses. `qa/r746/word-table.pdfjs.txt` (R746 "table
  layout — unreliable, unfixed"): `Languages: TypeScript, JavaScript, HTML, CSS,` that sat under EDUCATION
  was a bogus school `JavaScript, HTML, CSS,` with degree `Languages: TypeScript`; it is now a `Languages`
  custom section with that line as its bullet (the SKILLS heading follows it in the extracted order).
- Probes after: all Skills-position lines stay in skills as categorised lines; `Honors: Dean’s List`
  after a school → school detail; `Publications: Doe J. (2021) Paper` → `Publications` section, bullet
  `Doe J. (2021) Paper`; `Awards: …` + `Volunteering: …` → two sections with one bullet each.
- Known non-goal: a stray `Leadership, Negotiation` line placed after a school with no heading was an
  empty custom section before and is a bogus school `Negotiation` now — a list without a heading has no
  home either way; the recorded case (under Skills) is fixed.
- Gates: tsc app + worker / eslint / build / verify-dist green.

## Boundaries

- English heading words (`CUSTOM_HEADING_RE` list); `：` full-width colon accepted.
- Only lines whose label is a custom-section word; `Tools: docker` etc. were already handled by R714/SKILL_LABEL_RE.
