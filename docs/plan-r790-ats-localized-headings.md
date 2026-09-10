# R790 — /ats-checker reads every heading the product prints

Origin: R789 production QA. The same sample resume exported in English scored 95 with
22 checks on `/ats-checker`; exported in Spanish it scored 82 with 17 checks. The
importer (R789) read the Spanish export field for field, so the difference sat in the
scorer, not the parser. Recorded in `plan-r788` as a boundary; this round takes it.

## Evidence (`qa/r790-ats-langs.mts`)

`sampleResume()` exported with `resumeToPlainText` / `resumeToMarkdown` in each Builder
language, scored by `scoreResumeText` (the `/ats-checker` text path) against a short
requirements ad. Before this change:

| language          | score | structure | checks | difference from English                                                                                                                                                                                              |
| ----------------- | ----- | --------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| en TXT / MD       | 93    | 95        | 22     | —                                                                                                                                                                                                                    |
| es, fr, de, pt TXT / MD | 89 | 82     | 17     | `Standard section headings` true → **false**, `Skills section present` true → **false**; five checks **not run**: reverse-chronological order, 3–6 bullets per role, consistent date format, written months, entry locations |

Root cause, read in `src/lib/ats.ts`: `EXPERIENCE_HEADING_RE`, `NEXT_SECTION_RE`, the
"Standard section headings" and "Skills section present" expressions are English word
lists. `experienceBlock()` returns null when the experience heading is not found, so every
check derived from the experience block (`textDateRanges`, `textBulletCounts`,
`textEntryLocations`) reports `na` and the pronoun / buzzword / filler checks treat the
whole text as summary. The hint then tells a Spanish user to rename `Experiencia` to
"Experience".

The Builder score (`scoreResume`) reads structured fields and was never affected; only the
paste / upload path of `/ats-checker` was.

## Change

`ats.ts` builds its heading expressions from `defaultSectionLabels()` (R789's
source of truth in `resume.ts` — every default label in EN / ES / FR / DE / PT):

- `EXPERIENCE_HEADING_RE` = existing English forms + every `experience` label;
- `EDUCATION_HEADING_RE`, `SKILLS_HEADING_RE`, `SKILLS_INLINE_RE` (`Habilidades:` like `skills:`);
- `NEXT_SECTION_RE` = existing English list + every label of every section key except
  `summary` / `experience`.

Whole-line matching (optional trailing colon) as before, case-insensitive. The hint for
"Standard section headings" now says "or their equivalents in your resume's language".
No scoring weights, no parser, no requirement-extraction changes.

Rejected: a hand-written foreign vocabulary (no corpus evidence beyond our own exports);
language detection; relaxing whole-line matching (bullets that mention `Formation` /
`Kenntnisse` must stay body text — guarded by a test).

## Tests (`tests/ats.test.ts`, +6, `npm test` 160)

- ES / FR / DE / PT TXT and MD exports run the same 22 checks with the same results and
  the same score as the English export (fails 4/4 on the R789 scorer).
- Capitalised `EXPERIENCIA` / `EDUCACIÓN` + inline `Habilidades:` pass both heading checks
  and run the per-role bullet check (fails on R789).
- English resume whose bullets mention `Formation` / `Kenntnisse` / `Educación`: both
  bullets still counted under the one role (passes on both).

## Replay (`qa/r790-replay.mts`)

R789 scorer vs this branch, 114 retained texts + 72 R777-extractor PDF texts, no JD:
**186 / 186 identical** score and check list. The new forms occur only in our own
non-English exports; no retained real-world CV carries one.

## Boundaries

- Dates: `ene. 2022 – actualidad` is not a date range to `DATE_RANGE_RE` (ongoing words
  are English); the sample exports store English dates, so the five block checks ran here.
  User-typed localized end words are a separate item.
- English-only content checks (pronouns, buzzwords, filler, weak openers, passive voice)
  simply pass on non-English text — they do not read the resume's language.
- Headings users type themselves outside the five default label sets are unchanged.
