# R769 — Inline marks: `A*, Mathematics A*` is a grade list, not italics (CommonMark flanking)

## Evidence (deterministic, deployed `parseInlineMarks`, zero AI)

- R768 production QA (Oxford Careers Service DOCX, first real UK résumé through the import path):
  parser state holds `A Levels: Chemistry A*, Mathematics A*, Computer Science A, EPQ A* (50/50)` and
  `GCSEs: 11 A*- A, including A*s in Sciences, English and Mathematics` intact, but the preview renders
  `Chemistry A, Mathematics A` / `11 A- A, including As` — `*, Mathematics A*` and `*- A, including A*`
  are consumed as `*italic*` tokens. Recorded in the R768 PR as out of scope.
- Every render boundary shares `src/lib/marks.ts`: `ResumePreview` (inline runs + contentEditable
  innerHTML), `pdf.ts` (`richText`), `docx.ts` (runs), `ats.ts` (`stripInlineMarks` before keyword
  matching), `resume.ts` (plain-text/TXT export). The grade string is therefore wrong in the preview,
  in every PDF/DOCX/TXT export and in the ATS resume text, and the corrupted preview is what the user
  sees as "the import lost my grades".
- Harness `qa/r769-marks.mts` (not committed), deployed code:

  | text | today |
  |---|---|
  | `A Levels: Chemistry A*, Mathematics A*, Computer Science A, EPQ A* (50/50)` | `Chemistry A, Mathematics A, …` + italic `, Mathematics A` |
  | `GCSEs: 11 A*- A, including A*s in Sciences, …` | `11 A- A, including As …` + italic `- A, including A` |
  | `GCSEs: 9 A* grades` · `Rated 5* on Trustpilot; 4* on Google` · `*Contract role` · `Resume Tips*` | literal (single `*` or `*` followed by space) |
  | `*italic*` · `(*required*)` · `x *y*, z` · `**bold** ***both*** __under__` · `a*b*c` | styled as intended |

- Retained 114-text corpus: one asterisk case in total (`Resume Tips*` / `*This is a general guide…`,
  separate lines — unaffected). UK A-level `A*` has existed since 2010 and every UK school-leaver CV
  template lists it (Oxford example: 5 occurrences in two lines); the current rule makes any two
  `A*`s on one line eat the text between them.

## Root cause

`MARK_RE`'s italic alternative `\*[^*\s](?:[^*]*[^*\s])?\*` only forbids whitespace inside the
delimiters. CommonMark's *flanking* rule additionally says a `*` can open emphasis only when it is
not followed by whitespace **and**, if followed by punctuation, is preceded by whitespace /
punctuation / the line edge (mirrored for closers). `A*,` fails it (preceded by `A`, followed by `,`),
so no CommonMark renderer italicises the Oxford line.

## Decision

Adopt the CommonMark flanking rule for `*` runs (mature standard, no house rule): `nextMark()` scans
the regex matches and rejects an asterisk token whose opening run cannot open or whose closing run
cannot close, then resumes one character later. `__underline__` is unchanged (its intraword rule
differs and no evidence). Bold/italic tokens users already have (`**Python**,`, `(*note*)`,
`word**bold**word`) still parse — they flank.

Rejected: special-casing `A*` / grade vocabulary (house rule, misses `5*`, `C*`, footnotes);
escaping `*` on import (`\*` would then appear in the editor and every export path).

## Change

`src/lib/marks.ts`: `MARK_RE` global; `asteriskRunFlanks` / `asteriskRunCloses`; `nextMark(text, from)`
replaces the raw `MARK_RE.exec` in `hasInlineMarks` and `parseMarkRuns` (which now walks by index
so the character before a token is visible). `parseInlineMarks` / link handling / `domToMarks` untouched.

## Verification

- Harness table above → both Oxford lines literal, every styled case unchanged, `2*3=6 and 3*2=6`
  still italicises (`2*3` is left-flanking in CommonMark too — accepted, follows the standard).
- Gates: tsc app + worker, eslint, build, verify-dist.
- Production: Oxford DOCX import → preview shows `Chemistry A*, Mathematics A*` and `11 A*- A`;
  a copy with `**bold**` / `*italic*` bullets still renders styled; 1280 + 375; 0 AI calls.
