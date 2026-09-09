# R800 — a custom heading a template printed in capitals re-imports as the user wrote it

## Source

R799 production QA, recorded as a known deviation: a user-written custom
section titled `Volunteering` is printed `VOLUNTEERING` by the TXT / DOCX
exporters and by 15 of the 25 PDF templates; re-imported, the Builder shows
the section as `VOLUNTEERING` (Markdown keeps the title case, bullets exact).
Rezi keeps a custom section's title through its export / import loop.

## Evidence (first-hand, `qa/r800-evidence.mts`, `qa/r800-parse-replay.mts`)

- Templates: 15 / 25 print section headings in capitals (`headingUppercase`),
  10 in title case; TXT and DOCX always print capitals.
- Sample résumé + `Volunteering` custom section → TXT → R799 parser:
  `"VOLUNTEERING"`; → MD → `"Volunteering"`.
- Replay corpus: 11 / 186 documents carry shouted custom titles (19 of the 30
  custom sections seen): `EXTRACURRICULAR ACTIVITIES`, `TECHNICALWRITING`,
  `HONORS`, `ACTIVITIES`, `VOLUNTEER EXPERIENCE`, `LEADERSHIP AND INVOLVEMENT`,
  `AWARDS/HONORS`, `CONTACT`, `LANGUAGES`, `INTERESTS`, … — the shape is not
  only ours; every capitals-heading résumé opens in the Builder with shouted
  section titles the user then retypes.
- Markdown: a mixed-case custom heading (`## UX Research Work`) is stripped to
  a bare line by `plainResumeText` before the parser sees it, and the generic
  custom-heading rule only accepts ALL-CAPS or known section words, so a
  second custom section in an MD export was read as bullets of the first.

## Options considered

- **Reuse `humanNameCase` (R782)** — a name helper (particles, hyphens,
  apostrophes); "and / of / IT / UX" have no name analogue. Rejected.
- **Print custom headings in the user's case** — changes 15 templates' design
  (uppercase is the typographic choice) and does nothing for someone else's
  capitals résumé. Rejected.
- **Title-case a fully upper-case custom heading on import** (chosen) — the
  case is typography, not content; title case is what the Builder's own
  custom-section field shows and what the title-case templates print.

## Fix

- `src/lib/importText.ts` `headingCase(title)`: applied in `openCustom`. Only
  a title whose letters are all upper case and ≥ 4 letters long changes;
  small words (`and or of the for in on at to a an with de y et und e`) are
  lower-cased after the first word; runs of ≤ 2 letters or ≤ 3 letters without
  a vowel stay as acronyms (`IT`, `UX`, `SQL`, `CSS`); punctuation is kept
  (`AWARDS/HONORS` → `Awards/Honors`); mixed case (`Pro Bono Work`, `iOS Apps`)
  and short labels (`AWS`) are untouched.
- `src/lib/markdownText.ts` `markdownSectionHeadings(raw)`: the `## …` lines of
  a Markdown résumé. `parseResumeText` keeps them in a module-level
  `markedHeadings` set (saved / restored like `readerHeadings`) and
  `matchCustomHeading` accepts a line that was a `##` heading whatever its
  case — headings by declaration, `###` entry headers and bullets unaffected.
- Letter-spaced heading recovery learns `writing` (`T E C H N I C A L
  W R I T I N G` → `Technical Writing`, a real Pages export).
- Generic short ALL-CAPS custom heading (≤ 3 words): a `&` token no longer
  counts as a word (`UX & PRODUCT WORK` — found by production QA of the first
  deploy, fixed in the same PR).
- Standard-section recognition, structured lifting (R797), section order (R799),
  ATS, exports untouched.

## Tests (`npm test` 212 → 218)

- `tests/import/rules.test.ts` (R800 block): TXT and MD exports of
  `Volunteering` / `UX Research Work` / `Speaking Engagements` read back
  title for title, bullets exact, `sectionOrder` still lists the three custom
  slots; a Markdown `##` heading is a heading whatever its case while `###`
  and bullets are not; `headingCase` unit cases (small words, acronyms,
  separators, mixed case, short labels); an ALL-CAPS heading in a foreign
  document is title-cased; letter-spaced `TECHNICALWRITING` recovers its space.
- R780 / R781 expectations move from `ACTIVITIES` / `LANGUAGES` to
  `Activities` / `Languages` (the behaviour change, content identical).
- Golden `synth-sidebar.pdf.json`: `CONTACT / LANGUAGES / INTERESTS` titles →
  title case; nothing else.

## Replay (186 files vs the R799 parser byte copy)

`same 175 / 186; changed 11` — 11 documents, every change a custom-section
title casing (`EXTRACURRICULAR ACTIVITIES` → `Extracurricular Activities`,
`AWARDS/HONORS` → `Awards/Honors`, `LEADERSHIP AND INVOLVEMENT` → `Leadership
and Involvement`, …); Sumit's `TECHNICALWRITING` → `Technical Writing` also
shows in `sectionOrder` (the replay names custom slots by title). Bullets,
structured sections and section order otherwise byte-identical.

## Boundaries

- A user who deliberately titles a section in capitals (`FAQ`-style) gets
  title case back from a capitals template; the title-case templates and MD
  keep whatever was typed.
- Acronym detection is by length / vowels: `NASA` (4 letters, has vowels) →
  `Nasa`; `HTML` stays.
- Non-Latin scripts have no case and are unchanged.
