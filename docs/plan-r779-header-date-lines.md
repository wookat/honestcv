# R779 — import: a bare date line, a long `Role · Company` header and an abbreviation-ended employer are headers, not bullets

## Evidence (first-hand, retained corpus)

Replay harness: `qa/r779-replay.mts` (R778 parser `src/lib/_r778_importText.ts` vs this branch, 114 retained texts + 72 R777-extractor PDF texts). Inspectors: `qa/r779-exp.mts`, `qa/r779-show.mts`, `qa/r779-synth.mts`.

### 1. Our own PDF export re-imports with shifted headers (`/home/ubuntu/qa/r771-ox.pdf`)

`r771-ox.pdf` is the R771-era PDF *exported by this product* from the Oxford CV. Its text is the cleanest layout we ever emit:

```
Science Communication Micro-Intern (1 week) · Skin Bliss
Dec 2023
• Researched eczema, …
Publicity Officer · Oxford University Personalised Medicine Society
Oct 2023 – present
• Managing social media accounts …
IT Officer · Worcester College Junior Common Room (JCR)
Sept 2023 – present
• Leading the implementation …
```

R778 parser (and every round since R771 — the "7/2 oracle" in R775/R776 QA was the parser's own output, never read field by field):

```
Science Communication Micro-Intern (1 week) | Skin Bliss | – | 0 bullets
IT Officer · Worcester College Junior Common Room (JCR) | Dec 2023 | Oct 2023–present | 9 bullets (Skin Bliss's 3 + "Publicity Officer · Oxford University Personalised Medicine Society" as a bullet + Publicity's 5)
Sept 2023 | present | Sept 2023–present | IT Officer's 3 bullets
Mentor | Zero Gravity | Jul 2023–present | …   (rest correct)
```

Three causes, each read at its line:

- `Dec 2023` alone on a line: `SINGLE_DATE_RE` needs a separator before the month (`; Dec 2023`), `DATE_RANGE_RE` needs a range → not a date → `splitRoleCompany('Dec 2023')` opens an entry whose role is the date; the next header is then filed as that entry's "company line".
- `Publicity Officer · Oxford University Personalised Medicine Society` is 66 characters → `looksLikeBodyLine` (length > 60) → pushed as a bullet.
- A bare date range on its own line above a header (`Sept 2023 – present` after the misfiled lines) fell to the generic `else` with `rest = ''` → `splitRoleCompany(line)` → role `Sept 2023`, company `present`.

### 2. Canva employer ending in `Co.` (`/home/ubuntu/qa/r763-pdfs/canva-2.pdf`)

```
Giggling Platypus Co.
July 2020 - Jan 2022
Barista
```

R778: `Giggling Platypus Co.` ends in `.` → body line → last bullet of the previous role; `July 2020 - Jan 2022` becomes the Barista's company. Two of three roles in the file carry a wrong field.

### 3. `end- to-end` (`/home/ubuntu/qa/r773-linkedin/BhuResumeLatest.pdf`)

Marker-less experience continuation still joined with a space (`+= \` ${line}\``) while R778's `joinWrapped` was applied to bulleted continuation only. Summary lines were joined with `' '` too (no retained file wraps a hyphen in a summary; fixed for consistency).

## Design

`src/lib/importText.ts` only; no data-model or renderer change.

1. `BARE_MONTH_RE` — `^\(?Mon YYYY\)?$` → `extractDates` returns `{ rest: '', start, end: start }`. Bare years stay non-dates (R768).
2. Experience: a date-only line with no open entry, or under an entry that already has dates, opens a new entry holding the dates; the next header-shaped line (no role, no company, no bullets yet) fills it via `splitRoleCompany`. Previously that path made the date text the role.
3. `looksLikeDotHeader` — ≤120 chars, contains ` · `, no sentence punctuation at the end, ≤14 words → never a body line (prose does not carry a middle dot).
4. `looksLikeOrgName` — line ends in a company abbreviation (`Co.` `Inc.` `Ltd.` `Corp.` `LLC.` `GmbH.` …), ≤6 words, every word capitalised/connector → the period is not a sentence end. A markerless sentence such as `Led migration for Contoso Ltd.` keeps its lowercase words and remains a bullet (checked in `qa/r779-synth.mts`).
5. "Company on its own line" (second header line) applies only while the entry has no bullets — a company never follows its bullets.
6. `joinWrapped` for markerless experience continuation and summary lines (`joinWrappedLines`).

Rejected: reading dates by position (would break single-line `Role · Company · Dates` headers); a global "≤60 chars is a header" relaxation (R763 kept long headers as bullets for a reason — long markerless bullets exist in DOCX exports); treating every `.`-ended short line as a name (the sentence `Shipped v2.` would become a header).

## Replay (186 files, R778 parser vs branch)

173 identical; 13 changed, every one read:

| file | change | verdict |
|---|---|---|
| `r771-ox.pdf` | 7 entries → 7 entries, all `Role \| Company \| dates \| own bullets`; Skin Bliss `Dec 2023–Dec 2023` (renders once, R768) | fix |
| `canva-2.pdf` (+ `.pdfjs.txt`) | Barista gets `Giggling Platypus Co.`; Project Management Assistant loses the bogus bullet | fix; the interleaved lower two-column zone (Education/Certifications ∥ Extracurricular) reshuffles 2 → 4 nameless "projects" — known-unreliable interleaving (R764), neutral |
| `BhuResumeLatest.pdf` | `end- to-end` → `end-to-end` | fix |
| `word-table.pdf` (+ txt) | interleaved (R746 known unreliable): `Software Engineer \| Harbor Analytics \| Dec 2021` now carries its 3 bullets | improvement inside an unreliable file |
| `gdocs-sheets`, `gdocs-cloudcolleague`, `word-mac-quartz-stonybrook`, `canva-3` (pdf + txt) | placeholder templates / annotation prose / interleaved columns: placeholder lines regroup (`Company Name #2` no longer glued as company to an entry that already has bullets) | neutral — template residue, no real field before or after |

Unchanged: LinkedIn ×3 (Kenneth 22/5, Giovanni 7/1, 12-page), Oxford DOCX text, Alex, Sumit (4 projects), ronstr8, UFL, all R746 fixtures.

## Boundaries (not done / not verified)

- Bare-month lines fill experience/education/project dates; a bare **year** line still does not (R768, deliberate).
- Abbreviation list is English/Western (`Co. Inc. Ltd. Corp. LLC PLC Pvt. Bros. GmbH S.A. LP Jr. Sr. St. Dept. Univ. Assoc. Intl.`); an all-capitalised sentence ending in one of them would be a header.
- `Graduate Project Management Certification` in canva-2 still opens a Projects section (heading-shaped line containing "Project"; table order puts projects before certifications) — pre-existing, logged for a later round.
- Export replay not rerun (renderers untouched); production QA covers the Oxford PDF, Canva and Bhu imports end to end.
