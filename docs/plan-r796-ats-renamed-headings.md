# R796 — /ats-checker reads the headings the user renamed in the Builder

## Evidence (first-hand, `qa/r796-evidence.mts`)

R795 production QA: the sample resume with `sectionHeadings.experience =
"Work History"` exports with that heading, the importer reads it back, but
`/ats-checker` scored its export 88 / 17 checks while the default heading
scored 95 / 22. Local replay (sample resume → rename one heading → TXT export →
`scoreResumeText`) on the R795 scorer:

| renamed heading | Builder (structured) | text without metadata | 
| --- | --- | --- |
| default `Experience` | 91 / 23 | **95 / 22** |
| `Work History` / `Employment History` / `Career History` | 91 / 23 | 88 / 17 (Work History), 95 / 22 (others — `SECTION_WORDS` already knew them) |
| `Professional Background` / `Where I have worked` | 91 / 23 | 88 / 17 |
| education `Academic Background` / `Qualifications` | 91 / 23 | 86 / 22 |
| skills `Tools & Technologies` | 91 / 23 | 91 / 22 |

Root cause: `scoreResume(resume, jd)` has the whole `Resume`, including
`sectionHeadings`; `scoreResumeText(text, jd)` only had text. R790 made the
text scorer read every *default* heading the product prints (EN + ES/FR/DE/PT
via `defaultSectionLabels()`), but the user's own renames are arbitrary strings
— a plain TXT / MD / PDF / DOCX cannot say that `Where I have worked` means
experience. When `experienceBlock()` finds no experience heading, the five
experience-block checks (reverse-chronological, 3–6 bullets, date format,
named months, entry locations) are not run at all and "Standard section
headings" fails.

The information exists in the reader's own editor: `/ats-checker` already
loads the saved resume (`loadResume()`) for "Open in builder".

## Options considered

- **Broaden the generic vocabulary** (`SECTION_WORDS`) to cover more synonyms —
  helps `Work History`, cannot help `Where I have worked` or `Toolbox`, and
  every added word is a false-positive risk on prose (the R787 `About
  Recommendations` class). Rejected as the sole fix; kept as fallback.
- **Print a marker in exports** — only helps our own exports, visible to real
  ATS. Rejected (same reasoning as R795).
- **Pass the reader's `sectionHeadings` into the text scorer** — exact-label,
  whole-line match only; falls back to the default + generic vocabulary.
  Chosen.

## Fix

`src/lib/ats.ts`

- `scoreResumeText(input, jd, options?: { sectionHeadings })`. `/ats-checker`
  passes `loadResume()?.sectionHeadings` (the saved resume — the one whose
  export the reader is most likely checking). Pasted text with no saved
  resume keeps the R790 behaviour.
- One `HeadingLookup = (line) => sectionKey | null` shared by every text-path
  helper that used to test heading regexes on its own: `experienceBlock`,
  `findTextHeading` / `hasTextHeading`, `hasInlineSkillsHeading`,
  `textDateRanges`, `textBulletCounts`, `textPronounSegments` (pronoun / filler
  / buzzword anchoring), `textEntryLocations`. `textHeadingLookup(headings)`
  checks the exact custom label first (trimmed, case-insensitive, one trailing
  `:` allowed), then `textHeadingSection` (defaults + generic words).
- "Standard section headings" stays honest: it passes when the experience and
  education sections are found by *any* means, and when the user's label is
  one no ATS parser would look for, the hint names it —
  `"Where I have worked" / "Academic Background" is not a heading ATS parsers
  look for — use "Experience" / "Education" …`. The other 21 checks run.
- Generic vocabulary: `experience|employment|work history|career history`
  etc. is now the shared `src/lib/sectionWords.ts` (moved out of
  `importText.ts` unchanged, together with the job-title / credential /
  heading-shape guards) so the importer and the scorer read the same words.
  The importer's parse of the 186-file corpus is byte-identical
  (`qa/r796-parse-replay.mts`).

## Tests

`tests/ats.test.ts` + 4 (R796 block): `Work History` / `Employment History` /
`Career History` / `Professional Experience` TXT + MD exports run the same
22 checks with the same results as the default export **without** any hint;
an arbitrary experience / education / skills rename runs 17 checks blind and
22 with the hint, bullets-per-role result equals the default export, skills
found, "Standard section headings" fails with both custom labels quoted, score
strictly higher than blind; a bullet that repeats the custom label
(`Toolbox`) is not a heading; a default-heading export scores identically
with or without a hint. `npm test` 188 → 195 (the `it.each` counts 4).

## Replay (`qa/r796-replay.mts`, R795 scorer byte copy vs branch, 186 texts, no JD)

`same 177 / 186`; every change read:

- 3 LinkedIn PDFs (`Top Skills` sidebar heading), `chrome-print-ronstr8`
  (`Skills Programming Languages Technologies` — the skills heading printed
  on one line with its grid labels), Northstar sidebar TXT (gutter line
  `SKILLS               Languages: …`): "Skills section present" false → true.
  The old scorer only accepted `^(technical|core|key)? skills$`; the shared
  heading-shaped vocabulary (the same one the importer used since R763/R781
  to open these sections) accepts the whole heading line. Intended.
- `word365-ufl` (PDF + text): "Standard section headings" false → true — its
  only experience heading is `ADDITIONAL EXPERIENCE`, which the anchored
  regex missed and `\bexperience\b` on a heading-shaped line accepts. Intended.
- `word-cu` (PDF + text): 59 → 53 — a blank Word template whose experience
  entries have placeholder dates (`month/year–Present`). The old scorer did
  not know `ACTIVITIES` as a section boundary, so its experience block ran on
  into the ACTIVITIES prose whose example `(2023– 2025)` gave it one fake
  entry and five passing entry checks. Now the block ends at `ACTIVITIES`,
  contains no date range, and the five entry checks are not run — the same
  treatment any experience section without dates gets. Honest reading.

## Follow-up from production QA: the health panel read the same text blind

The first deploy fixed the score and the 22-check table, but the
testing agent found the **Priority fixes** panel next to it still said
`Quantified impact — No experience bullets yet`, `Action verbs — No
experience bullets yet`, `Completeness — Add 3+ achievement bullets` and
`Summary is 141 words` for the same custom-heading export — the panel is
built from `resumeHealth(parseResumeText(text))`, a second read of the
text that had no access to the reader's headings. Oracle
(`qa/r796-health-oracle.mts`, sample with experience / education / skills
renamed → TXT):

| parse | experience | education | skills | custom sections | summary chars | priority fixes |
|---|---|---|---|---|---|---|
| blind | 1 | 1 | 0 | 2 | 863 | 5 (the four above + "Add a skills section") |
| with `sectionHeadings` | 2 | 1 | 81 | 0 | 216 | 2 ("Use standard section headings", word count) |

Fix: `parseResumeText(input, { sectionHeadings })` — the importer's own
heading table (`OWN_HEADINGS`, R789) is consulted after a per-call map
built from the reader's renames (core keys → their section, other keys →
a custom section with the user's title); a label still has to be a whole
heading line. The map is set for the duration of one parse and restored in
`finally`, so a hinted parse never leaks into the next one. Call sites:
`/ats-checker` (health analysis and Replace resume), Builder Import
dialog, Dashboard open-imported — every content-replacing import of a
saved resume, so importing your own renamed export also reads back into
the same sections. No-hint parse is byte-identical on the 186-file corpus
(`qa/r796-parse-replay.mts`, 186 / 186).

## Boundaries

- Custom labels match a whole heading line only (exact, case-insensitive,
  optional trailing colon); a bullet or sentence containing the label is
  content.
- The hint comes from the **saved** resume. Checking someone else's file
  while your own resume uses `Where I have worked` cannot mis-read that
  file: the label must appear as a line in the pasted text.
- Builder structured scoring (`scoreResume`) is unchanged — it never depended
  on heading text.
- Not fixed here: the Builder's live score has no "standard headings" check,
  so a rename is only flagged on `/ats-checker`.
