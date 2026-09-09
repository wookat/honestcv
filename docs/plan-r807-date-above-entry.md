# R807 — a date / year line printed above its entry dates that entry

## Source

R804 fixed a lone graduation year printed **below** an education entry and
recorded the mirror shape as an open boundary; R806 recorded it again as the
R807 candidate: a date line printed **above** the entry it dates

```
EDUCATION
2018
MS Data Science · Tech Institute
2016
BS Computer Science · State University
```

was stored as three education entries — `2018` as a degree of its own, then
`MS Data Science / Tech Institute` dated **2016** (the year meant for the next
entry, taken by R804's below-rule), then `BS Computer Science / State
University` with no dates. The Builder shows a `2018` card, every template
prints it as a school line, the ATS check counts an extra entry, and the two
real entries carry the wrong / no year.

Experience already read a **range** above its header (`Jan 2020 – Present` /
`Senior Engineer · Acme Corp`) since R779, but not a bare year: `2021` /
`Contract Engineer · Acme` stored `Contract Engineer` as the role and `2021`
as the company, and the real company line became a second job.

Timeline-style layouts (date column on the left, rendered as the line before
the header in linear text) are a common CV shape in Canva / Word timeline
templates and in copy-paste from LinkedIn's mobile app.

Evidence (`qa/_r807probe.mts`, R806 parser vs this branch):

| shape | R806 | R807 |
| --- | --- | --- |
| `2018` / `MS Data Science · Tech Institute` / `2016` / `BS … · State University` | 3 entries: `2018` as a degree; MS dated 2016; BS undated | 2 entries: MS 2018/2018, BS 2016/2016 |
| `2018` / `Tech Institute` / `MS Data Science` | `2018` entry + undated MS entry | 1 entry MS / Tech Institute 2018/2018 |
| `2014 – 2018` / `Tech Institute` / `MS Data Science` / `2010 – 2014` / … | range entry + shifted dates | MS 2014–2018, BS 2010–2014 |
| `2021` / `Contract Engineer · Acme` / `- Built.` | role `Contract Engineer`, company `2021`, second job `Acme` | 1 job `Contract Engineer / Acme` 2021/2021 |
| `Jan 2020 – Present` / `Senior Engineer` / `Acme Corp` / bullets | already correct | unchanged |
| `2020 – 2021` / `Engineer · Acme` (range above header) | already correct | unchanged |
| `MS … · Tech Institute` / `2018` (R804, year below) | correct | unchanged |
| `- Shipped v2 in 2021.` / `- 2019 award.` | bullets | unchanged |

## Fix (narrow)

`src/lib/importText.ts`, education and experience branches only:

```ts
// education: a date range / lone year that neither belongs to the current
// entry (R804: entry has a name and no dates yet) nor sits inline with a header
} else if (year || (!rest && start)) {
  currentEdu = { ...emptyEducation(), id, startDate: year ?? start, endDate: year ?? end }
  resume.education.push(currentEdu)
// the line right under it names the pending, date-only entry
} else if (currentEdu && !degree && !school && currentEdu.startDate && !start
           && !isEduPlaceLine(line) && !isEduDetailLine(line)
           && (looksLikeDotHeader(line) || !looksLikeBodyLine(line))) {
  Object.assign(currentEdu, newEducationEntry(line, currentEdu.startDate, currentEdu.endDate), { id })
}

// experience: the existing "range above the header" rule also takes a lone year
} else if (year || (!rest && start)) {   // was: !rest && start
  currentExp = { ...emptyExperience(), id, startDate: year ?? start, endDate: year ?? end, bullets: [] }
```

`newEducationEntry(header, start, end)` is the previous inline "new entry"
construction hoisted into a helper so the pending entry is named by exactly the
same degree / school / location orientation as a fresh entry
(`splitRoleCompanyRaw`, `isDegreeLine`, `SCHOOL_RE`, place / detail fallbacks).
The one-field-per-line follow-up lines (`MS Data Science`, `GPA: 3.9`) then
fill the entry through the existing R770 branches.

Guards on the naming line: not a `City, ST` place, not an honours / GPA /
modules detail (`isEduDetailLine`), and not a body sentence (`looksLikeBodyLine`
unless it is a `Role · Company` dot header). A detail sentence under a lone
date line therefore stays a detail on a nameless dated entry instead of
becoming the degree — that is the word-table replay case below.

## Rejected

- Teaching `extractDates` to read a lone four-digit number globally — every
  `2008` inside a bullet or a degree name becomes a date (R804 rejected the same).
- Look-ahead ("is the next line a header?") — the pending-entry state already
  exists for experience (R779) and the two-line school / degree layout (R770)
  makes "the next line" ambiguous; filling forward through the existing
  branches reuses their orientation rules instead of duplicating them.
- Accepting any line as the name of a pending dated entry — the replay showed
  a detail sentence (`First Class Honours. Final project: …`) would become a
  degree.

## Old / new proof

- New test `R807: a date / year line printed above its entry dates that entry`
  (`tests/import/rules.test.ts`, 228 → 229) fails on the frozen R806 parser
  (`src/lib/_r806_importText.ts`): `expected [ [ '2018', '', '', '', '' ], …(2) ]
  to deeply equal [ [ 'MS Data Science', …(4) ], …(1) ]`.
- 186-file retained replay vs the frozen R806 parser (`qa/r807-parse-replay.mts`):
  **183 identical, 3 changed, all education only**:
  - `qa/r746/word-table.pdf` + its pdfjs text: the Word-table extraction prints
    `BSc Computer Science · University of Bristol` **before** the `EDUCATION`
    heading (extractor shape, pre-existing) and the range + honours after it.
    R806 stored degree `2017`, school `Jun 2020`, details honours; R807 stores a
    nameless entry dated 2017 – Jun 2020 with the honours as details. The
    header line is still filed with the previous section (unchanged).
  - `/home/ubuntu/qa/r763-pdfs/canva-3.pdf`: Canva placeholder template
    (`Enter Your Degree` / `University/College/High School`, interleaved
    two-column extraction, unreadable since R802). `2008` moves from being the
    *school* of the first placeholder entry to dating it; the second placeholder
    entry keeps its date. Both readings are template placeholder text.
- Goldens unchanged.

## Boundaries (recorded, not fixed)

- A date line followed by a body sentence opens a nameless dated entry (the
  honours case) — no degree is invented; the user sees the dates and details.
- A date line above a `City, ST` line then the header: the place is skipped
  by the existing place branch, the header still names the entry; not
  probed in production QA.
- Two consecutive date lines: the second opens its own nameless entry.
- Projects / custom sections do not take a date line above their header.
