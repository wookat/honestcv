# R803 — function benchmark refresh + a "City, ST" header line is the location, not the title

## Benchmark (SOP-10, function-oriented, 5 rounds since R799)

- Rezi public pages (`/`, `/ai-resume-builder`, `/pricing`, `/resume-checker`,
  `/job-search`, `/ai-cover-letter-builder`, `/ai-interview`,
  `/resume-keyword-scanner`): 7 × 200 (title / h1 / byte count identical to
  the R799 capture), `/ai-interview` → `/tools/ai-interview-practice` as
  before, `/resume-keyword-scanner` still 404. No new public capability.
- Production routes: `/` `/builder` `/ats-checker` `/jobs` `/dashboard`
  `/documents` `/examples/` 200, `/pricing` 307 → `/pricing/`. Same as R799.
  `/api/jobs/search?q=engineer` 200 in 1.6 s, 150 rows from remotive /
  jobicy / arbeitnow, every row attributed (R747), 0 descriptions with raw
  markup (R724).
- No new P0. The P1 list stays import-fidelity: every round since R793 found
  the next item in our own round trip or in the retained corpus; this round's
  comes from the corpus (`qa/r803-evidence.mts`).

## Source

`qa/r803-evidence.mts` over the 186 retained texts (R802 parser): 175 with a
`contact.title`, 11 without. Reading the 175 titles for values that are not a
title: `Any City, ST` (Canva `canva-1.pdf`, and its pdf.js text twin),
`City, ST` (`canva-3.pdf`), `Y O U R N A M E` (Word placeholder — template
text, not a defect), one long LinkedIn headline (legitimate). Focused probe
(`qa/_r803canva.mts`): `Jane Doe` / `Austin, TX` / `email · phone` stores
`title = 'Austin, TX'` **and** `location = 'Austin, TX'` — the place is read
correctly by the location scan and then a second time by the default branch,
which takes any ≤ 60-char non-contact line under the name as the title. The
Builder shows the city in the "Professional title" field and every template
prints it under the name; the Canva layout (contact row, then the city on
its own line) is common in template exports.

## Options considered

- **Skip only lines equal to the already-read `contact.location`** — misses
  the case where the location scan read a different line (`City, ST | phone`
  row) and the bare city appears again; also ties two scans together by
  string equality. Rejected.
- **Do not set `headerProse` on the place line** — a summary paragraph under
  `Name / City, ST` is then dropped (the default branch only keeps prose once
  the header has begun). Rejected; the place line is part of the header.
- **Place line is a header line, not a title** (chosen) — in the default
  branch a non-contact line matching the existing `isExpPlaceLine` shape
  (≤ 40 chars, comma-separated capitalised parts, no job-title noun, no
  company suffix) is skipped as a title. Under the name it opens the header
  (`headerProse = true`) so prose below it is the summary; after the summary
  it starts the contact block (`headerProse = false`, the previous behaviour
  for that position). The title is additionally required to sit above the
  summary (`summaryLines.length === 0`): with the place line no longer
  claiming the slot, a short body fragment in a headerless paste
  (`canva-3.pdf`: `Conduct ad hoc analysis as requested by management to`)
  would otherwise become the title.

## Implementation (`src/lib/importText.ts`, default branch)

```ts
if (!contactish && isExpPlaceLine(line)) {
  headerProse = summaryLines.length === 0
} else if (!resume.contact.title && summaryLines.length === 0 && line.length <= 60 && !contactish) {
  resume.contact.title = line
  headerProse = true
} else if (…unchanged…)
```

## Proof

- `tests/import/rules.test.ts` +1 (223 → 224): `Name / City, ST / contact`,
  Canva `Name / contact row / Any City, ST / SKILLS`, title before and after
  the place line kept, a paragraph under the place line is the summary (and
  the first job still parses), `Director, Engineering` and `Acme, Inc` stay
  titles. Fails on the R802 parser (`expected { title: 'Austin, TX' } to
  match { title: '' }`).
- 186-text replay vs the R802 byte copy (`qa/r803-parse-replay.mts`):
  **183 identical, 3 changed, all `contact.title` only** — `canva-1.pdf` and
  its pdf.js twin `Any City, ST` → `''`, `canva-3.pdf` `City, ST` → `''`.
  Two intermediate rules were rejected by this replay: setting `headerProse`
  unconditionally moved `chrome-print-ronstr8.pdfjs.txt`'s dropped gutter
  bullets into a 1.9 k-char summary (the place line after the summary must
  close the header, as before); leaving the ≤ 60 title rule alone made
  `canva-3.pdf`'s title `patterns, and insights`, then `Conduct ad hoc
  analysis…` — hence "title above the summary".
- Goldens unchanged; `npm test` 224; tsc ×3 / eslint / build / verify-dist
  green.

## Boundaries

- A ≤ 60-char sentence under the place line with no summary before it is
  still the title (`Engineer who ships.`) — existing rule, unchanged.
- A place line longer than 40 chars, or with a job-title noun / company
  suffix, is not a place and keeps its existing treatment.
- The location scan itself is unchanged; this round only stops the same line
  being stored a second time as the title.
- `canva-3.pdf` remains unreadable (interleaved Canva placeholder
  extraction); it now stores neither a name nor a title.
