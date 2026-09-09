# R802 — a paste with no name line keeps its first job and leaves the name empty

## Source

Queued since R801 (`docs/plan-r801-sidebar-label-column.md`): a résumé pasted
or uploaded without a name line — an experience block copied out of a
document, a LinkedIn "About" + jobs paste, a PDF whose header was cut off —
stored a date, an entry header or the summary sentence as `contact.fullName`
and lost the first job. Rezi's importer leaves the name blank when it finds
none rather than inventing one.

## Evidence (first-hand, `qa/_r801probe.mts`, `qa/r802-evidence.mts`)

Parser at R801 (`src/lib/_r801_importText.ts`) on four shapes:

| paste | `fullName` | `title` | experience |
| --- | --- | --- | --- |
| headless (`Role · Company, City, ST` / dates / bullets ×2 jobs, then EDUCATION, SKILLS) | `Jan 2020` | `Present` | 1 blank entry with 1 bullet (both jobs lost) |
| `EXPERIENCE` heading first | `Jan 2020` | `Present` | role + company read, **dates lost** to the name |
| summary sentence first, then `EXPERIENCE` | `Senior Engineer · Acme Corp` | the summary sentence | 1 blank entry |
| contact row only (`email · phone`), then the job | `Senior Engineer · Acme Corp` | `Jan 2020 – Present` | 1 blank entry |

Two paths wrote the name: the first-five-lines scan accepted any ≤6-word
line without e-mail / phone / heading (so a date line or a `Role · Company`
header qualified), and the headless shape had no section to file the header
and its bullets under, so the default branch made the header the title and
dropped everything else until `EDUCATION`.

Retained corpus (186 texts, `qa/r802-evidence.mts`, R801 parser): 5 files
whose stored name is not a name — `canva-3.pdf` (an interleaved two-column
Canva extraction that opens with `2019 - 2022`; name stored `City, ST`),
and the four Word placeholder files (`Y O U R N A M E`, `FIRST NAME LAST
NAME`) which are template text, not a defect. So the corpus carries one
real instance; the shape is otherwise a paste shape, which the corpus (files
users uploaded) under-represents by construction.

## Options considered

- **Require the name to match a name shape (`NAME_HEAD_RE`)** — rejects real
  five-token names (`Maria José da Silva Santos`), names with suffixes
  (`Jane Doe, PMP`) and anything non-Latin the regex does not cover. The
  corpus names are read correctly today; a positive shape test would trade
  known-good names for the no-name case. Rejected.
- **Reject lines with digits / binders / sentence punctuation one by one** —
  a growing blacklist that still lets an unmarked body line (`Led a team of
  engineers`) through once the earlier lines are skipped. Rejected in favour
  of a positional rule.
- **The name sits above the body** (chosen) — the scan stops at the first
  line that has started the document body: a bullet, a date line, a line
  carrying a date range, or a `Role · Company` / `Role | Company` header
  over a date line (binders that a contact row also uses, so a row with
  e-mail / phone / URL is not a header; a `Jane Doe | Senior Engineer` row
  above the contact row has no date under it and keeps its existing
  treatment). A `City, ST` place line before the name is skipped, not
  taken. Nothing below that line can be the name, so the scan ends with
  `fullName = ''` — the Builder shows an empty name field, which is the
  truth. `Name — Headline` lines keep their existing treatment (checked
  before the stop rule, so a headline containing ` · ` still yields the
  name).
- **Headless experience block** — before any heading, a bound header whose
  next non-empty line is a bare date line (or which carries dates itself)
  opens `experience` implicitly and is parsed by the ordinary experience
  branch, so `sectionOrder` records experience first (R799) and later
  headings continue as usual. A `Name | Title` line followed by a contact
  row has no date line under it and is untouched.

## Implementation (`src/lib/importText.ts`)

```ts
const isHeadlessEntryHeader = (line, next) =>
  /\S\s(?:·|\|)\s\S/.test(line) && !isContactRow(line) &&
  (bareDate(next) !== null || (extractDates(line).start && extractDates(line).rest))
const startsBody = (line, next) =>
  isBullet(line) || bareDate(line) !== null || !!extractDates(line).start || isHeadlessEntryHeader(line, next)

for (const [n, line] of nonEmpty.slice(0, 5).entries()) {
  const dash = line.split(/\s+[—–]\s+/)
  const named = dash.length > 1 && NAME_HEAD_RE.test(dash[0])
  if (!named && startsBody(line, nonEmpty[n + 1] ?? '')) break
  if (!named && isExpPlaceLine(line)) continue
  …existing acceptance…
}

// main loop, before the section switch
if (section === null && isHeadlessEntryHeader(line, nextNonEmpty)) {
  section = 'experience'; noteSection('experience')
}
```

The late `header[0]` fallback is the LinkedIn parser's and is not on this
path.

## Proof

- `tests/import/rules.test.ts` +2 (221 → 223): the four shapes above read
  `fullName ''`, both headless jobs with location / dates / bullet counts,
  education and skills intact, experience ordered before education; a place
  line above the name is skipped; `Jane Doe — Senior Engineer · Acme Corp`
  and `Jane Doe` + `email | phone | City, ST` are unchanged. Both tests fail
  on the R801 parser (`expected 'Jan 2020' to be ''`, `expected 'Austin, TX'
  to be 'Jane Doe'`). A first pass that stopped at any bound line broke
  `Jane Doe | Senior Engineer` (name lost); the date-under-it condition
  restored it (`qa/_r802probe2.mts`).
- 186-text replay vs the R801 byte copy (`qa/r802-parse-replay.mts`):
  **185 identical, 1 changed** — `canva-3.pdf`, whose interleaved extraction
  opens with a date: name `City, ST` → `''`, title `patterns, and insights`
  → `City, ST`, summary gains the first wrapped bullet, the four garbage
  entries unchanged. The file is unreadable either way (Canva two-column
  placeholder template); the change removes a place from the name slot.
- Goldens unchanged; `npm test` 223; tsc ×3 / eslint / build / verify-dist
  green.

## Boundaries

- A header bound with ` at ` or ` — ` (`Engineer at Acme`, `Engineer —
  Acme`) does not open the implicit experience section; ` — ` is our own
  `Name — Headline` shape and ` at ` prose is ambiguous. Such a paste still
  needs an `EXPERIENCE` heading.
- A summary paragraph with no heading above the first job is still the
  title when it is ≤ 60 characters, and is dropped when longer and no name /
  title precedes it (existing default-branch behaviour, unchanged by R802).
- `Jane Doe | Senior Engineer` above the contact row is stored whole as the
  name, as before; splitting it is not this round's target.
- A `Role · Company` header directly over bullets with no date line is still
  ambiguous with a name row and is read as before.
- A paste that opens with an unmarked, undated sentence and no binder is not
  detected as body; the existing ≤ 6-word rule decides.
